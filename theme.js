/* Read only the authenticated account's existing cache. No global theme cache. */
(()=>{
 'use strict';
 function apply(value){
  const theme=['classic-white','liquid-glass','instagram-minimal-v3'].includes(value)?value:'classic-white';
  document.documentElement.dataset.theme=theme;
  if(theme==='instagram-minimal-v3')document.querySelectorAll('.ig-cover[data-src]:not([src])').forEach(img=>{img.src=img.dataset.src;});
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='liquid-glass'?'#F8FCFF':theme==='instagram-minimal-v3'?'#FFFFFF':'#faf8f5');
 }
 function restore(userId){
  let theme;
  try{theme=JSON.parse(localStorage.getItem('gym-tracker-pro-v1:'+userId))?.settings?.theme;}catch{}
  apply(theme);
 }
 window.GymTheme={apply,restore};
})();
