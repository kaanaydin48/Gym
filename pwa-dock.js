/* Keep iOS Home Screen controls out of WebKit's drifting fixed layer. */
(()=>{
 'use strict';
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const viewport=window.visualViewport;
 if(!ios||!standalone||!viewport)return;
 const nav=document.getElementById('mobileNav'),timer=document.getElementById('restTimer');
 if(!nav||!timer)return;
 const dock=document.createElement('div');
 dock.id='pwaDock';
 document.body.append(dock);
 dock.append(nav,timer);
 document.documentElement.classList.add('ios-pwa-dock');
 const mobile=window.matchMedia('(max-width: 680px)');
 let frame=0;
 function update(){
  frame=0;
  // pageTop already includes both document scroll and the visual viewport offset.
  // Absolute positioning avoids the iOS standalone fixed/sticky compositor bug.
  dock.style.top=`${viewport.pageTop+viewport.height}px`;
  dock.style.left=`${viewport.pageLeft}px`;
  dock.style.width=`${viewport.width}px`;
  dock.style.setProperty('--dock-nav-height',`${nav.getBoundingClientRect().height}px`);
  const active=document.activeElement;
  const editing=active&&(active.matches('input:not([type=checkbox]):not([type=radio]),textarea,select')||active.isContentEditable);
  const keyboard=editing&&window.innerHeight-viewport.height>120&&viewport.scale===1;
  dock.classList.toggle('keyboard-open',!!keyboard&&mobile.matches);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 function settle(){schedule();[100,300,600].forEach(delay=>setTimeout(schedule,delay));}
 viewport.addEventListener('resize',schedule);
 viewport.addEventListener('scroll',schedule);
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',settle);
 window.addEventListener('orientationchange',settle);
 window.addEventListener('pageshow',settle);
 document.addEventListener('focusin',settle);
 document.addEventListener('focusout',settle);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)settle();});
 if(window.ResizeObserver)new ResizeObserver(schedule).observe(nav);
 mobile.addEventListener('change',schedule);
 update();
})();
