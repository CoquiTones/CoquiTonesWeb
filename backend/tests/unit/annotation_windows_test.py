import unittest
from datetime import timedelta

from annotation.models import AnnotationSlice, SPECIES_FIELDS
from annotation.windows import (
    build_window_grid,
    classifier_slice_to_annotation,
    normalize_classifier_slices,
    validate_slices,
)


class FakeClassifierSlice:
    def __init__(self, start, end, **overrides):
        self.starttime = start
        self.endtime = end
        for field in SPECIES_FIELDS:
            setattr(self, field, overrides.get(field, False))


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


class TestAnnotationWindows(unittest.TestCase):
    def test_build_window_grid_handles_empty_and_partial_windows(self):
        self.assertEqual(build_window_grid(0), [])
        self.assertEqual(build_window_grid(9), [(0, 0, 9)])
        self.assertEqual(
            build_window_grid(22.5),
            [(0, 0, 10), (1, 10, 20), (2, 20, 22.5)],
        )

    def test_validate_slices_accepts_contiguous_windows(self):
        slices = [make_slice(0), make_slice(1), make_slice(2, end=22.5)]
        validate_slices(slices)

    def test_validate_slices_rejects_empty_report(self):
        with self.assertRaisesRegex(ValueError, "At least one"):
            validate_slices([])

    def test_validate_slices_rejects_non_contiguous_indexes(self):
        with self.assertRaisesRegex(ValueError, "contiguous"):
            validate_slices([make_slice(0), make_slice(2)])

    def test_validate_slices_rejects_wrong_start_boundary(self):
        with self.assertRaisesRegex(ValueError, "must start"):
            validate_slices([make_slice(0, start=1, end=11)])

    def test_validate_slices_rejects_long_window(self):
        with self.assertRaisesRegex(ValueError, "longer than"):
            validate_slices([make_slice(0, end=10.5)])

    def test_classifier_slice_normalizes_aligned_window(self):
        result, warning = classifier_slice_to_annotation(
            FakeClassifierSlice(timedelta(seconds=10), timedelta(seconds=20), coqui=True)
        )
        self.assertIsNone(warning)
        self.assertEqual(result.window_index, 1)
        self.assertTrue(result.coqui)

    def test_classifier_slice_rejects_unaligned_window(self):
        result, warning = classifier_slice_to_annotation(
            FakeClassifierSlice(timedelta(seconds=1), timedelta(seconds=5))
        )
        self.assertIsNone(result)
        self.assertIn("does not match", warning)

    def test_normalize_collects_warnings_and_sorts(self):
        slices = [
            FakeClassifierSlice(timedelta(seconds=20), timedelta(seconds=30)),
            FakeClassifierSlice(timedelta(seconds=1), timedelta(seconds=5)),
            FakeClassifierSlice(timedelta(seconds=0), timedelta(seconds=10)),
        ]
        normalized, warnings = normalize_classifier_slices(slices)
        self.assertEqual([item.window_index for item in normalized], [0, 2])
        self.assertEqual(len(warnings), 1)


if __name__ == "__main__":
    unittest.main()
