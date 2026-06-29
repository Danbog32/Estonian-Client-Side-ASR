# Text Alignment Benchmark

This benchmark measures the product behavior: how closely the highlighted word
matches the word being read in the audio.

The downloaded dataset already contains `.wav`, `.txt`, and `.TextGrid` files.
Use `.txt` as the reference text and `.TextGrid` as draft word-level ground
truth. Review/correct the generated ground-truth JSON before treating results as
final, especially for child speech, repeated words, and mispronunciations.

## Commands

```bash
npm run benchmark:text-alignment:discover -- --dataset /Users/pb096/Downloads/OneDrive_1_6-29-2026
npm run benchmark:text-alignment:ground-truth
npm run benchmark:text-alignment:evaluate -- --predictions benchmarks/text-alignment/predictions
```

## Files

- `dataset.csv` maps audio files to reference text and TextGrid files.
- `ground-truth/*.json` contains reviewed word timestamps.
- `predictions/*.json` should contain app-exported highlight logs.
- `results/results.json`, `summary.csv`, and `report.html` contain metrics.

Prediction logs should use this shape:

```json
{
  "id": "sample_id",
  "records": [
    {
      "timeSec": 1.42,
      "predictedWordIndex": 2,
      "confidence": 0.81,
      "matchedPhrase": "keegi laulis oksal",
      "asrText": "keegi laulis oskar"
    }
  ]
}
```
