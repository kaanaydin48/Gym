# Exercise motion integration

16 built-in movements have original six-frame illustrations, a white background, gray figure and orange muscle highlights. The 960x640 WebP sheets are played forward/backward using CSS discrete frames. They are short illustrated loops, not video or motion-captured demonstrations. Leg Curl uses the prone variant; plank remains an isometric hold.

The workout header and movement library share the same normalized-name lookup. Custom unknown movements retain their equipment badge. The media button opens a larger dialog. A pause/play button controls all loops for this page session. The initial pause state follows prefers-reduced-motion. Offscreen and background-tab playback is paused. Files are requested when visible.

No account state, cloud schema, saved day, sets, kg, reps or RIR fields are changed.

Validation: JS syntax; all 16 names mapped; all 16 WebP files decode with correct dimensions; Node audit covers modal open/pause and confirms unchanged state; each uploaded blob matches the local git blob hash. Actual signed-in browser interaction was not available in this environment.
