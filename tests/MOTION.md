# Exercise motion integration

All 40 built-in movements have original six-frame illustrations with white background, gray anatomical figure and orange target-muscle highlights. The 24 added sheets use the same 960x640 WebP format and existing CSS playback, enlargement and pause controls. These are discrete illustrated loops, not motion-captured videos.

Both the workout and library views use the same name lookup. Unknown custom movements retain their equipment badge. Reduced-motion preferences, offscreen loading and background-tab pausing remain supported. No workout or account data is changed by this update.

Validation: JavaScript syntax; all 40 names mapped to nonempty decodable assets; simulated DOM audit checks opening each animation and pause controls without changing state, alongside existing cloud-save regression tests. Actual signed-in browser interaction was unavailable in this environment.

Assets were created with the built-in image generation tool. Prompt brief: six sequential exercise poses in a 3x2 grid, fixed camera and scale, full-body gray mannequin, white background, dark equipment and orange target-muscle overlays, with movement-specific joint and equipment instructions. Final assets: assets/exercises/*.webp.
