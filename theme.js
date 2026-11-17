/* Read only the authenticated account's existing cache. No global theme cache. */
(()=>{
 'use strict';
 function apply(value){
  const theme=value==='liquid-glass'?'liquid-glass':'classic-white';
  document.documentElement.dataset.theme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='liquid-glass'?'#F8FCFF':'#faf8f5');
 }
 function restore(userId){
  let theme;
  try{theme=JSON.parse(localStorage.getItem('gym-tracker-pro-v1:'+userId))?.settings?.theme;}catch{}
  apply(theme);
 }
 window.GymTheme={apply,restore};
})();
