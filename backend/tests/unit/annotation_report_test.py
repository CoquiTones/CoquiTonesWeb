import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from annotation.models import AnnotationSource, SPECIES_FIELDS
from annotation.report import build_report


def make_record(index, start=None, end=None, **overrides):
    start = index * 10 if start is None else start
    end = start + 10 if end is None else end
    values = {
        "anid": index + 1,
        "arid": 7,
        "windowindex": index,
        "starttime": timedelta(seconds=start),
        "endtime": timedelta(seconds=end),
    }
    for field in SPECIES_FIELDS:
        values[field] = overrides.get(field, False)
    return SimpleNamespace(**values)


def make_manual_report(arid=7):
    return SimpleNamespace(
        arid=arid,
        afid=42,
        ownerid=3,
        savedat=datetime(2026, 10, 31, 12, 0, tzinfo=timezone.utc),
    )


def make_classifier_slice(start, end, **overrides):
    values = {
        "starttime": timedelta(seconds=start),
        "endtime": timedelta(seconds=end),
    }
    for field in SPECIES_FIELDS:
        values[field] = overrides.get(field, False)
    return SimpleNamespace(**values)


class TestAnnotationReportResolution(unittest.TestCase):
    def test_manual_report_wins_over_classifier_rows(self):
        report = build_report(
            afid=42,
            manual_report=make_manual_report(),
            manual_slices=[make_record(0, coqui=True), make_record(1)],
            classifier_slices=[make_classifier_slice(0, 10, gryllus=True)],
        )

        self.assertEqual(report.source, AnnotationSource.manual)
        self.assertEqual(report.report_id, 7)
        self.assertEqual(report.saved_at, make_manual_report().savedat)
        self.assertEqual([item.window_index for item in report.slices], [0, 1])
        self.assertTrue(report.slices[0].coqui)
        self.assertFalse(report.slices[0].gryllus)
        self.assertEqual(report.warnings, [])

    def test_classifier_rows_are_normalized_when_no_manual_report_exists(self):
        report = build_report(
            afid=42,
            classifier_slices=[
                make_classifier_slice(20, 30, wightmanae=True),
                make_classifier_slice(0, 10, coqui=True),
            ],
        )

        self.assertEqual(report.source, AnnotationSource.classifier)
        self.assertIsNone(report.report_id)
        self.assertIsNone(report.saved_at)
        self.assertEqual([item.window_index for item in report.slices], [0, 2])
        self.assertTrue(report.slices[0].coqui)
        self.assertTrue(report.slices[1].wightmanae)
        self.assertEqual(report.warnings, [])

    def test_empty_report_uses_none_source(self):
        report = build_report(afid=42)

        self.assertEqual(report.source, AnnotationSource.none)
        self.assertEqual(report.slices, [])
        self.assertEqual(report.warnings, [])

    def test_manual_report_without_slices_falls_back_with_a_warning(self):
        report = build_report(
            afid=42,
            manual_report=make_manual_report(),
            manual_slices=[],
            classifier_slices=[make_classifier_slice(0, 10, locustus=True)],
        )

        self.assertEqual(report.source, AnnotationSource.classifier)
        self.assertTrue(report.slices[0].locustus)
        self.assertEqual(len(report.warnings), 1)
        self.assertIn("manual report", report.warnings[0].lower())

    def test_unaligned_manual_windows_are_skipped_with_a_warning(self):
        report = build_report(
            afid=42,
            manual_report=make_manual_report(),
            manual_slices=[
                make_record(0, coqui=True),
                make_record(1, start=12, end=22, coqui=True),
            ],
        )

        self.assertEqual(report.source, AnnotationSource.manual)
        self.assertEqual([item.window_index for item in report.slices], [0])
        self.assertEqual(len(report.warnings), 1)
        self.assertIn("manual", report.warnings[0].lower())

    def test_unaligned_classifier_windows_are_reported(self):
        report = build_report(
            afid=42,
            classifier_slices=[
                make_classifier_slice(0, 10, coqui=True),
                make_classifier_slice(12, 22, gryllus=True),
            ],
        )

        self.assertEqual(report.source, AnnotationSource.classifier)
        self.assertEqual([item.window_index for item in report.slices], [0])
        self.assertEqual(len(report.warnings), 1)
        self.assertIn("ten-second", report.warnings[0])

    def test_classifier_rows_missing_species_values_are_skipped(self):
        incomplete = SimpleNamespace(
            starttime=timedelta(seconds=0),
            endtime=timedelta(seconds=10),
            coqui=True,
        )

        report = build_report(afid=42, classifier_slices=[incomplete])

        self.assertEqual(report.source, AnnotationSource.none)
        self.assertEqual(report.slices, [])
        self.assertEqual(len(report.warnings), 1)
        self.assertIn("missing species", report.warnings[0].lower())

    def test_duplicate_manual_windows_are_skipped_with_a_warning(self):
        report = build_report(
            afid=42,
            manual_report=make_manual_report(),
            manual_slices=[make_record(0, coqui=True), make_record(0, gryllus=True)],
        )

        self.assertEqual(report.source, AnnotationSource.manual)
        self.assertEqual(len(report.slices), 1)
        self.assertTrue(report.slices[0].coqui)
        self.assertEqual(len(report.warnings), 1)
        self.assertIn("duplicate", report.warnings[0].lower())


if __name__ == "__main__":
    unittest.main()
