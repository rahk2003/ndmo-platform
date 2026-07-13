import asyncio
import tempfile
import time
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from main import (
    build_question_domain_context,
    build_stratified_row_sample,
    get_analysis_chunks,
    infer_answer_from_evidence,
    score_chunks_for_question,
    upload_and_analyze_ndmo_domain_evidence,
)


class EvidenceAnalysisTests(unittest.TestCase):
    def setUp(self):
        self.provider_patch = patch("main.AI_PROVIDER", "rule_based")
        self.semantic_patch = patch("main.SEMANTIC_RETRIEVAL_ENABLED", False)
        self.provider_patch.start()
        self.semantic_patch.start()
        self.addCleanup(self.provider_patch.stop)
        self.addCleanup(self.semantic_patch.stop)

    @staticmethod
    def chunk(text, score=0.5, level="row"):
        return {
            "text": text,
            "search_text": text,
            "sheet_name": "Evidence",
            "row_number": 2,
            "column_name": "Evidence",
            "chunk_level": level,
            "similarity_score": score,
        }

    def test_large_evidence_is_reduced_to_bounded_candidates(self):
        chunks = [
            {
                "text": f"NDMO_Domain: Data Governance; approved policy procedure owner {index}",
                "search_text": "approved data governance policy procedure owner",
                "sheet_name": "Policies",
                "row_number": index,
                "column_name": "Policy",
                "chunk_level": "row",
                "non_empty_count": 4,
            }
            for index in range(1000)
        ]
        context = build_question_domain_context({
            "domain_name_en": "Data Governance",
            "domain_name_ar": "حوكمة البيانات",
        })

        candidates = score_chunks_for_question(
            "Is there an approved data governance policy?",
            chunks,
            context,
        )

        self.assertLessEqual(len(candidates), 200)
        self.assertTrue(all("similarity_score" in item for item in candidates))
        self.assertGreaterEqual(
            candidates[0]["similarity_score"],
            candidates[-1]["similarity_score"],
        )

    def test_semantic_retrieval_ranks_by_embedding_not_keyword_overlap(self):
        chunks = [
            {**self.chunk("Arabic governance evidence"), "_semantic_embedding": [1.0, 0.0]},
            {**self.chunk("policy owner review repeated keywords"), "_semantic_embedding": [0.0, 1.0]},
        ]
        with (
            patch("main.SEMANTIC_RETRIEVAL_ENABLED", True),
            patch("main.call_ollama_embeddings", return_value=[[1.0, 0.0]]),
        ):
            candidates = score_chunks_for_question(
                "Is this requirement supported?",
                chunks,
                {"names": ["حوكمة البيانات", "Data Governance"]},
            )

        self.assertEqual(candidates[0]["text"], "Arabic governance evidence")
        self.assertEqual(candidates[0]["retrieval_method"], "semantic")

    def test_semantic_index_cache_reuses_identical_file_contents(self):
        prepared = [{"text": "cached", "_semantic_embedding": [1.0]}]
        with tempfile.TemporaryDirectory() as directory:
            first_file = Path(directory) / "first.xlsx"
            second_file = Path(directory) / "second.xlsx"
            first_file.write_bytes(b"identical evidence")
            second_file.write_bytes(b"identical evidence")

            with (
                patch("main.SEMANTIC_RETRIEVAL_ENABLED", True),
                patch("main.SEMANTIC_CHUNK_CACHE", {}),
                patch("main.get_file_chunks", return_value=[{"text": "raw"}]),
                patch("main.prepare_semantic_chunks", return_value=prepared) as prepare,
            ):
                self.assertEqual(get_analysis_chunks(first_file), prepared)
                self.assertEqual(get_analysis_chunks(second_file), prepared)

        prepare.assert_called_once()

    def test_stratified_sample_covers_beginning_and_end(self):
        sampled_rows = build_stratified_row_sample(2, 10001, 400)

        self.assertEqual(len(sampled_rows), 400)
        self.assertIn(2, sampled_rows)
        self.assertIn(10001, sampled_rows)
        self.assertTrue(set(range(2, 102)).issubset(sampled_rows))

    def test_header_only_does_not_count_as_assigned_owner(self):
        result = infer_answer_from_evidence(
            "Is there an assigned owner responsible for this domain?",
            [self.chunk("AC: Data_Owner; AE: Data_Steward", level="header")],
            response_language="Arabic",
        )

        self.assertEqual(result["ai_answer"], "no")
    def test_populated_owner_is_supported(self):
        result = infer_answer_from_evidence(
            "Is there an assigned owner responsible for this domain?",
            [self.chunk("Data_Owner: Data Governance Office")],
            response_language="Arabic",
        )

        self.assertEqual(result["ai_answer"], "yes")

    def test_technical_owned_flag_is_not_an_assigned_owner(self):
        result = infer_answer_from_evidence(
            "Is there an assigned owner responsible for this domain?",
            [self.chunk("Is_KSU_Owned: No; Technical_Attribute_Description: record owner type")],
            response_language="Arabic",
        )

        self.assertEqual(result["ai_answer"], "no")

    def test_approved_policy_is_supported(self):
        result = infer_answer_from_evidence(
            "Is there a documented policy or procedure for this domain?",
            [self.chunk("Evidence_Type: Policy; Approval_Status: Approved; Policy_Name: Data Classification Policy")],
            response_language="Arabic",
        )

        self.assertEqual(result["ai_answer"], "yes")

    def test_classification_values_without_policy_are_partial(self):
        context = build_question_domain_context({
            "domain_name_en": "Data Classification",
            "domain_name_ar": "تصنيف البيانات",
        })
        result = infer_answer_from_evidence(
            "Is there a documented policy or procedure for this domain?",
            [self.chunk("Data_Classification_Level: سري")],
            response_language="Arabic",
            domain_context=context,
        )

        self.assertEqual(result["ai_answer"], "partial")

    def test_clinical_procedure_text_is_not_a_governance_policy(self):
        context = build_question_domain_context({
            "domain_name_en": "Data Operations",
            "domain_name_ar": "عمليات البيانات",
        })
        result = infer_answer_from_evidence(
            "Is there a documented policy or procedure for this domain?",
            [self.chunk("Technical_Attribute_Description: clinical procedure identifier")],
            response_language="Arabic",
            domain_context=context,
        )

        self.assertEqual(result["ai_answer"], "no")

    def test_metric_without_cadence_is_partial(self):
        result = infer_answer_from_evidence(
            "Is this domain measured and improved periodically?",
            [self.chunk("Quality_Score: 87%; Review_Date: 2026-07-01")],
            response_language="Arabic",
        )

        self.assertEqual(result["ai_answer"], "partial")

    def test_metric_with_cadence_is_supported(self):
        result = infer_answer_from_evidence(
            "Is this domain measured and improved periodically?",
            [self.chunk("Quality_Score: 87%; Review_Date: 2026-07-01; Cadence: Quarterly")],
            response_language="Arabic",
        )

        self.assertEqual(result["ai_answer"], "yes")

    def test_review_word_without_metric_is_not_periodic_measurement(self):
        result = infer_answer_from_evidence(
            "Is this domain measured and improved periodically?",
            [self.chunk("Technical_Attribute_Description: the clinical review note")],
            response_language="Arabic",
        )

        self.assertEqual(result["ai_answer"], "no")


class EvidenceEndpointResponsivenessTests(unittest.IsolatedAsyncioTestCase):
    async def test_uploaded_analysis_does_not_block_the_event_loop(self):
        def slow_analysis(*_args, **_kwargs):
            time.sleep(0.25)
            return [], {
                "limited": False,
                "analyzed_questions": 0,
                "question_offset": 0,
                "next_offset": 0,
                "batch_size": 3,
                "total_available_questions": 1,
            }

        connection = MagicMock()
        connection.cursor.return_value = MagicMock()
        request = SimpleNamespace(state=SimpleNamespace(current_user={"id": 1}))

        with (
            patch("main.create_ai_assessment_tables"),
            patch("main.get_domain_by_id", return_value={"id": 1}),
            patch("main.get_questions_by_domain_id", return_value=[{"id": 1}]),
            patch("main.save_uploaded_evidence_file", new=AsyncMock(return_value={"id": 1})),
            patch("main.analyze_questions_against_evidence", side_effect=slow_analysis),
            patch("main.get_connection", return_value=connection),
            patch("main.save_domain_assessment_run", return_value={"id": 1, "created_at": "now"}),
        ):
            task = asyncio.create_task(upload_and_analyze_ndmo_domain_evidence(
                request=request,
                domain_id=1,
                evidence_type="Document",
                response_language="Arabic",
                max_questions=3,
                question_offset=0,
                file=object(),
            ))
            await asyncio.sleep(0.03)
            self.assertFalse(task.done())
            await task


if __name__ == "__main__":
    unittest.main()
