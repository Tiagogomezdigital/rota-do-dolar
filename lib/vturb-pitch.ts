type PitchPlayer = {
  displayHiddenElements: (seconds:number, selectors:string[], options:{display:string;persist:boolean})=>void;
};

/** Register only after player:ready; the SDK uses video playback, not page elapsed time. */
export function registerVturbPitch(player:unknown, seconds:number|null, selector:string):boolean {
  if(typeof seconds!=='number'||!Number.isFinite(seconds)||seconds<0||!selector.trim())return false;
  if(!player||typeof player!=='object'||!('displayHiddenElements' in player)||typeof player.displayHiddenElements!=='function')return false;
  (player as PitchPlayer).displayHiddenElements(seconds,[selector],{display:'block',persist:false});
  return true;
}
