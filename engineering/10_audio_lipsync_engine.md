# 10_AUDIO_LIPSYNC_ENGINE — MOD-AUDIO · MOD-LIPSYNC · MOD-VISEME

## MOD-AUDIO (REQ-AUD-001/002)
- **Ingest**: MP3/WAV/AIFF (+OGG/FLAC/M4A ours) → decode (worker) → `SoundAsset{durationMs,sampleRate,channels,dataRef}` + waveform peaks (cached).
- **Attachment** (on keyframe): `{assetId, sync:event|start|stop|stream, loop, trimStartMs, trimEndMs, volume, envelope[]}`.
- **Sync semantics** (F-17-04): Event=plays out+overlap · Start=no overlap of same sound · Stop=silence at key (same asset) · Stream=frame-synced (drop ANIMATION frames, audio never).
- **Playback**: rAF tick samples audio at frame boundaries; scrub plays at position (toggle); mute; fps change re-maps waveform extent.
- **Edit**: trim in/out (non-destructive), volume %, envelope curve (inline draggable), fade presets.
- **Export** (REQ-AUD-002): video = sample-exact mux per frame; HTML = asset + `{startAt,loop,sync}` metadata; GIF/sequence = silent + warn; project = assets + refs.

## MOD-VISEME — mouth symbol (F-18-01/02)
- Mouth = graphic symbol, one frame per viseme, labeled; `mouthPoses[{frame,viseme}]`.
- 12-viseme default chart (A, B/M, C/D, D, E, F/V, L/TH, O, U, W/Q, rest, extra).
- Driven by instance `firstFrame` (F-11-08) — reuses symbol system, no parallel model.

## MOD-LIPSYNC (REQ-LIP-001/002; ENG-015)
Pipeline (worker job, STM-JOB):
```
audio → VAD (silence threshold) → phoneme recognition [{phoneme,startMs,endMs,confidence}]
→ viseme dictionary (pluggable; default 12) → [{viseme,startFrame,endFrame,confidence}]
→ merge same-viseme runs → sub-frame collisions (longest wins)
→ emit mouth-layer keyframes {frame, firstFrame=visemePose}   // one undoable command (journal)
```
- **UI** (C-29): Lip Syncing dialog (12 visemes → map to frames; choose audio layer; Sync) → progress + cancel → phoneme lane (colored blocks + confidence) → drag boundaries re-time → lead/lag offset → blend toggle (default snap) → batch multi-character → regenerate.
- **Constraints** (REQ-LIP-001): Stream sync required (warn if Event); applies on mouth span / selected range; result fully editable (Frame Picker / swap / drag keys / F5 hold).
- **Cancellation**: cancel discards analysis; partial = keep lane, no keys written until Sync commits (journal).

## Acceptance
- **REQ-AUD-001-A**: Given stream sound on frames 1–48 @24fps; When play; Then audio stays frame-locked (drops animation frames if needed, audio never skips); scrub@24 plays audio at that position.
- **REQ-AUD-002-A**: Given trimmed/looped stream; When export MP4; Then audio mux is sample-exact per frame (A/V offset 0 within tolerance).
- **REQ-LIP-001-A**: Given audio + mouth symbol (12 visemes); When Sync; Then keyframes written matching visemes; When Undo; Then all auto keys removed in one step.
- **REQ-LIP-002-A**: Given auto result; When drag a phoneme boundary; Then mouth keys re-time and remain manually editable.

## Performance
- Decode + waveform: worker; peaks downsampled (≤ 4k points per visible range).
- Lip-sync: [ENGINEERING TARGET] <5s per 60s audio on mid CPU; cancellable.
