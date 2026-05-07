from collections import defaultdict
from statistics import median, quantiles

from .serializers import PublicTestSerializer


def calculate_stats_for_tests(tests):
    """
    Calculate statistics for a list of tests.
    Returns min, max, mean, median, Q1, Q3, std dev for all numeric fields.
    """
    numeric_fields = [
        "peak_strength",
        "bond_strength",
        "yield_strength",
        "ultimate_deformation",
        "stiffness",
        "loading_rate",
        "energy_absorption",
    ]

    stats = {}

    for field in numeric_fields:
        values = [getattr(t, field) for t in tests if getattr(t, field) is not None]

        if values:
            count = len(values)
            min_val = min(values)
            max_val = max(values)
            mean_val = sum(values) / count
            med_val = median(values)
            std_val = (
                (sum((x - mean_val) ** 2 for x in values) / count) ** 0.5 if count > 1 else 0.0
            )

            try:
                quants = quantiles(values, n=4)
                q25_val = quants[0]
                q75_val = quants[2]
            except Exception:
                q25_val = None
                q75_val = None

            stats[field] = {
                "count": count,
                "min": min_val,
                "max": max_val,
                "mean": mean_val,
                "median": med_val,
                "q25": q25_val,
                "q75": q75_val,
                "std_dev": std_val,
            }
        else:
            stats[field] = None

    # Handle number_of_drops separately
    values = [t.number_of_drops for t in tests if t.number_of_drops is not None]
    if values:
        count = len(values)
        min_val = min(values)
        max_val = max(values)
        mean_val = sum(values) / count
        med_val = median(values)
        std_val = (sum((x - mean_val) ** 2 for x in values) / count) ** 0.5 if count > 1 else 0.0

        try:
            quants = quantiles(values, n=4)
            q25_val = quants[0]
            q75_val = quants[2]
        except Exception:
            q25_val = None
            q75_val = None

        stats["number_of_drops"] = {
            "count": count,
            "min": int(min_val),
            "max": int(max_val),
            "mean": mean_val,
            "median": med_val,
            "q25": q25_val,
            "q75": q75_val,
            "std_dev": std_val,
        }
    else:
        stats["number_of_drops"] = None

    return stats


def group_tests_by_bolt(tests):
    """
    Group tests by bolt_id and calculate stats for each bolt.
    Returns dict: {bolt_id: {tests: [...], stats: {...}}}
    """
    grouped = defaultdict(list)

    # Group tests by bolt_id
    for test in tests:
        grouped[test.bolt_id].append(test)

    # Build response
    result = {}
    for bolt_id, bolt_tests in grouped.items():
        serializer = PublicTestSerializer(bolt_tests, many=True)
        stats = calculate_stats_for_tests(bolt_tests)

        result[str(bolt_id)] = {"tests": serializer.data, "stats": stats}

    return result
