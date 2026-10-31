import unittest

from annotation.models import SPECIES_FIELDS, AnnotationSaveRequest, AnnotationSlice
from annotation.save import (
    AnnotationConflictError,
    check_conflict,
    slice_rows,
    validate_save_request,
)


def make_slice(index, start=None, end=None, **overrides):
    start = index * 10 if start is None else start
    end = start + 10 if end is None else end
    species = {field: overrides.get(field, False) for field in SPECIES_FIELDS}
    return AnnotationSlice(
        window_index=index,
        start_time=start,
        end_time=end,
        **species,
    )


def make_request(slices=None, base_report_id=None, overwrite=False, afid=42):
    return AnnotationSaveRequest(
        afid=afid,
        base_report_id=base_report_id,
        overwrite=overwrite,
        slices=slices if slices is not None else [make_slice(0)],
    )


class TestAnnotationSaveRules(unittest.TestCase):
    def test_matching_base_report_has_no_conflict(self):
        check_conflict(latest_report_id=7, base_report_id=7)

    def test_first_save_has_no_conflict(self):
        check_conflict(latest_report_id=None, base_report_id=None)

    def test_missing_latest_report_is_not_a_conflict(self):
        check_conflict(latest_report_id=None, base_report_id=7)

    def test_stale_base_report_raises_a_conflict(self):
        with self.assertRaises(AnnotationConflictError) as context:
            check_conflict(latest_report_id=9, base_report_id=7)

        self.assertEqual(context.exception.latest_report_id, 9)

    def test_first_save_after_another_save_raises_a_conflict(self):
        with self.assertRaises(AnnotationConflictError) as context:
            check_conflict(latest_report_id=3, base_report_id=None)

        self.assertEqual(context.exception.latest_report_id, 3)

    def test_explicit_overwrite_bypasses_the_conflict(self):
        check_conflict(latest_report_id=9, base_report_id=7, overwrite=True)

    def test_validate_accepts_a_contiguous_report(self):
        validate_save_request(make_request([make_slice(0), make_slice(1), make_slice(2, end=25)]))

    def test_validate_rejects_a_gap(self):
        with self.assertRaisesRegex(ValueError, "contiguous"):
            validate_save_request(make_request([make_slice(0), make_slice(2)]))

    def test_validate_rejects_an_unaligned_start(self):
        with self.assertRaisesRegex(ValueError, "must start"):
            validate_save_request(make_request([make_slice(0, start=1, end=11)]))

    def test_validate_rejects_a_window_longer_than_ten_seconds(self):
        with self.assertRaisesRegex(ValueError, "longer than"):
            validate_save_request(make_request([make_slice(0, end=11)]))

    def test_slice_rows_convert_seconds_to_intervals_and_keep_species(self):
        rows = slice_rows(
            12,
            [make_slice(0, coqui=True), make_slice(1, end=22.5, gryllus=True)],
        )

        self.assertEqual(len(rows), 2)
        arid, index, start, end, *species = rows[1]
        self.assertEqual(arid, 12)
        self.assertEqual(index, 1)
        self.assertEqual(start.total_seconds(), 10)
        self.assertEqual(end.total_seconds(), 22.5)
        self.assertEqual(len(species), len(SPECIES_FIELDS))
        self.assertTrue(species[SPECIES_FIELDS.index("gryllus")])


if __name__ == "__main__":
    unittest.main()
