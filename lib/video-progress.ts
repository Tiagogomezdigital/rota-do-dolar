export type PlayedInterval={start:number;end:number};
export type VideoProgress={watched:number;unlocked:boolean};

/** Use actual media playback ranges, rather than elapsed time or summed timeupdate deltas. */
export function getVideoProgress(played:readonly PlayedInterval[],revealAtSeconds:number|null|undefined):VideoProgress{
  const intervals=played.filter(({start,end})=>Number.isFinite(start)&&Number.isFinite(end)&&start>=0&&end>start)
    .map(interval=>({...interval})).sort((a,b)=>a.start-b.start);
  const merged:PlayedInterval[]=[];
  for(const interval of intervals){
    const previous=merged[merged.length-1];
    if(previous&&interval.start<=previous.end)previous.end=Math.max(previous.end,interval.end);
    else merged.push(interval);
  }
  const watched=merged.reduce((total,{start,end})=>total+end-start,0);
  const first=merged[0];
  const configured=typeof revealAtSeconds==='number'&&Number.isFinite(revealAtSeconds)&&revealAtSeconds>=0;
  // Later playback cannot fill a skipped section before the pitch.
  const unlocked=configured&&!!first&&first.start===0&&first.end>=revealAtSeconds;
  return {watched,unlocked};
}
