"""Render the public case-study chart from ERAMIA-RS 2026, Table 1.

Source: https://sol.sbc.org.br/index.php/eramiars/article/view/47396
Values are reported test F1 means and sample standard deviations across
10 paired seeds. The main MLP baseline uses a learning rate of 0.05.
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


RESULTS = {
    "Banknote": [(0.813, 0.032), (0.868, 0.031), (0.943, 0.026), (0.961, 0.122)],
    "Blood": [(0.089, 0.079), (0.302, 0.148), (0.360, 0.098), (0.441, 0.168)],
    "Mammographic": [(0.615, 0.064), (0.782, 0.032), (0.784, 0.042), (0.770, 0.063)],
}
MODELS = ("1L", "2L", "4L", "MLP")
PANEL = "#101824"
TEXT = "#edf4fb"
MUTED = "#b6c8da"
GRID = "#34485c"
QUANTUM = "#7cc8fa"
CLASSICAL = "#ffcc85"
DESTINATION = Path(__file__).resolve().parents[1] / "public/images/vqc-depth-test-f1.png"


def main() -> None:
    figure, axes = plt.subplots(
        1, len(RESULTS), figsize=(7.5, 2.75), sharey=True, layout="constrained"
    )
    figure.patch.set_facecolor(PANEL)
    for axis, (dataset, values) in zip(axes, RESULTS.items(), strict=True):
        axis.set_facecolor(PANEL)
        axis.set_title(dataset, color=TEXT, fontsize=11, weight="semibold", pad=8)
        axis.set_ylim(0, 1.12)
        axis.set_xlim(-0.5, 3.5)
        axis.set_yticks([0, 0.25, 0.5, 0.75, 1.0], ["0", "0.25", "0.50", "0.75", "1.00"])
        axis.set_xticks(range(len(MODELS)), MODELS)
        axis.tick_params(colors=MUTED, length=0, labelsize=10)
        axis.grid(axis="y", color=GRID, linewidth=0.65)
        axis.set_axisbelow(True)
        for spine in axis.spines.values():
            spine.set_visible(False)
        for index, (mean, sd) in enumerate(values):
            classical = MODELS[index] == "MLP"
            axis.errorbar(
                index, mean, yerr=sd, fmt="D" if classical else "o",
                color=CLASSICAL if classical else QUANTUM, capsize=3,
                linewidth=1.5, markersize=5.5, linestyle="none",
            )
    axes[0].set_ylabel("Test F1", color=TEXT, fontsize=11)
    figure.savefig(DESTINATION, dpi=135, facecolor=PANEL)
    plt.close(figure)


if __name__ == "__main__":
    main()
