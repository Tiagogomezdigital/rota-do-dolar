'use client';

import {useId, type ReactNode} from 'react';

type IllustrationProps = {
  name:string;
  detail?:string;
  size?:'small'|'large';
};

/** Small, original editorial scenes. Labels remain the source of meaning. */
export function QuizIllustration({name,detail,size='small'}:IllustrationProps){
  const id=useId().replace(/:/g,'');
  const ink='#293C35', green='#238365', softGreen='#D9EEDF', coral='#D78B73', blue='#7DADC0';
  const gold=`url(#${id}-gold)`, paper=`url(#${id}-paper)`, leaf=`url(#${id}-green)`;
  const hair=detail==='46+'?'#7F8B82':ink;
  const feminine=detail==='mulher';
  const ageBand=['15-25','26-35','36-45','46+'].indexOf(detail??'');
  const goalBand=['50-300','450-700','750-1000','1000-2000','3000+'].indexOf(detail??'');
  const barHeights=goalBand<0?[15,25,37]:[12+goalBand*4,20+goalBand*4,27+goalBand*4];
  const minuteHand=detail==='10-30'?'M32 22v11l9 5':detail==='1-2h'?'M32 21v12l10-6':'M32 22v11l9 5';
  let scene:ReactNode;
  switch(name){
    case 'gift':
      scene=<><path d="M13 30 33 23 53 30 33 39Z" fill="#FFF2B5"/><path d="M14 30v23l19 8V38Z" fill={gold}/><path d="m33 38 19-8v23l-19 8Z" fill="#E0B445"/><path d="m9 26 23-8 24 8-23 9Z" fill={gold}/><path d="M9 26v7l24 9v-7Zm24 9 23-9v7l-23 9" fill="#F3CC65"/><path d="m25 21 8 3 8-3M33 25v36" fill="none" stroke={green} strokeWidth="5"/><path d="M32 23c-17 0-13-14-6-10 4 2 6 10 6 10Zm1 0c17 0 13-14 6-10-4 2-6 10-6 10Z" fill={softGreen} stroke={green} strokeWidth="2"/><path d="m49 41 8-3v9l-8 3Z" fill={paper} stroke={ink} strokeWidth="1.5"/><path d="m51 44 2 2 2-4" fill="none" stroke={green} strokeWidth="1.5"/></>;
      break;
    case 'check':
      scene=<><path d="m15 13 28-3 8 9 3 36-34 3Z" fill={paper} stroke={ink} strokeWidth="2"/><path d="m43 10 1 11 7-2" fill="#E7DFBE"/><path d="m23 22 11-1m-10 8 18-2m-18 9 11-1" stroke="#A1B0A2" strokeWidth="2"/><path d="m39 45 1 15 6-4 6 3-2-17" fill={gold}/><circle cx="44" cy="40" r="13" fill={leaf} stroke={ink} strokeWidth="2"/><path d="m38 40 4 4 8-9" fill="none" stroke="white" strokeWidth="3"/></>;
      break;
    case 'close':
      scene=<><path d="m16 13 28-3 8 9 2 36-33 3Z" fill={paper} stroke={ink} strokeWidth="2"/><path d="m44 10 1 11 7-2" fill="#E7DFBE"/><path d="m24 23 10-1m-9 8 16-2m-16 9 8-1" stroke="#A1B0A2" strokeWidth="2"/><circle cx="44" cy="44" r="12" fill="#E7DBD0" stroke="#8A7367" strokeWidth="2"/><path d="m40 40 8 8m0-8-8 8" stroke="#7F6257" strokeWidth="2.5"/></>;
      break;
    case 'compass':
      scene=<><path d="m44 11 7-4 6 8-6 5" fill={gold} stroke={ink} strokeWidth="2"/><circle cx="31" cy="36" r="23" fill={gold} stroke={ink} strokeWidth="2"/><circle cx="31" cy="36" r="18" fill={paper} stroke={ink} strokeWidth="1.5"/><path d="M31 21v4m0 22v4M16 36h4m22 0h4" stroke="#8C9A8C" strokeWidth="1.7"/><path d="m41 23-6 17-14 9 6-17Z" fill={leaf} stroke={ink} strokeWidth="1.7"/><path d="m41 23-6 17-8-8Z" fill="#D88C72"/><circle cx="31" cy="36" r="2.5" fill={paper} stroke={ink} strokeWidth="1.3"/></>;
      break;
    case 'briefcase':
      scene=<><path d="M25 21v-6c0-4 17-4 17 0v6" fill="none" stroke={ink} strokeWidth="3"/><path d="m10 24 43-5 4 34-43 5Z" fill={gold} stroke={ink} strokeWidth="2"/><path d="m10 24 4 16 20 2 22-7-3-16" fill="#FCE7A0" stroke={ink} strokeWidth="2"/><path d="m30 36 7-1 1 11-7 1Z" fill={leaf} stroke={ink} strokeWidth="1.5"/><path d="m19 47 1 7m30-11 1 7" stroke="#BC9030" strokeWidth="2"/></>;
      break;
    case 'search':
      scene=<><path d="m12 13 27-3 7 8 3 35-31 3Z" fill={paper} stroke={ink} strokeWidth="2"/><path d="m39 10 1 10 6-2" fill="#E5E3D3"/><path d="m21 23 11-1m-10 9 16-2m-16 9 10-1" stroke="#A6B4A8" strokeWidth="2"/><path d="m43 43 12 12" stroke={ink} strokeWidth="8"/><path d="m44 44 10 10" stroke={gold} strokeWidth="5"/><circle cx="36" cy="34" r="13" fill="#DCEEE9" fillOpacity=".92" stroke={ink} strokeWidth="2.5"/><path d="M30 33c0-4 3-6 6-6" fill="none" stroke="white" strokeWidth="3"/></>;
      break;
    case 'chart':
      scene=<><path d="M10 53h45" fill="none" stroke={ink} strokeWidth="2"/>{barHeights.map((height,i)=><rect key={i} x={14+i*15} y={53-height} width="9" height={height} fill={i===0?'#A8CFB9':i===1?gold:leaf} stroke={ink} strokeWidth="1.5"/>)}<path d={`M12 ${47-barHeights[0]} 25 ${43-barHeights[1]} 34 ${47-barHeights[1]} 49 ${47-barHeights[2]}m-8 0h8v8`} fill="none" stroke={green} strokeWidth="2.5"/><circle cx="51" cy="47" r="11" fill={gold} stroke={ink} strokeWidth="1.7"/><path d="M51 40v14m3-11c-7-4-9 4-3 4 6 0 4 7-3 3" fill="none" stroke="#85641C" strokeWidth="1.7"/></>;
      break;
    case 'phone':
      scene=<><rect x="18" y="8" width="29" height="49" rx="7" fill={ink}/><rect x="21" y="12" width="23" height="40" rx="4" fill={paper}/><path d="M27 12h11v3H27" fill={ink}/><circle cx="32" cy="34" r="9" fill={gold}/><path d="m27 34 4 4 7-8" fill="none" stroke={green} strokeWidth="2.5"/><path d="m42 42 15 4-3 13-15-4Z" fill={leaf} stroke={ink} strokeWidth="1.5"/><path d="m43 49 7 2m-21-3h7" stroke="white" strokeWidth="2"/></>;
      break;
    case 'monitor':
      scene=<><path d="M28 43v10m12-10v10M22 55h24" stroke={ink} strokeWidth="3"/><rect x="8" y="12" width="49" height="32" rx="4" fill={ink}/><rect x="11" y="15" width="43" height="24" rx="2" fill={paper}/><path d="M16 33h8v-7h8v-6h8v-3" fill="none" stroke={green} strokeWidth="3"/><circle cx="46" cy="27" r="6" fill={gold}/><path d="m40 44 15 4-3 10-15-4Z" fill={gold} stroke={ink} strokeWidth="1.5"/></>;
      break;
    case 'user':
      if(ageBand>=0){
        scene=<><rect x="12" y="12" width="42" height="45" rx="5" fill={paper} stroke={ink} strokeWidth="2"/><path d="M12 17c0-3 2-5 5-5h32c3 0 5 2 5 5v9H12Z" fill={gold} stroke={ink} strokeWidth="1.8"/><path d="M23 8v9m20-9v9" stroke={ink} strokeWidth="3"/>{[0,1,2,3].map(i=><g key={i}><rect x={19+(i%2)*16} y={32+Math.floor(i/2)*13} width="10" height="8" rx="2" fill={i===ageBand?leaf:'#DFE7D9'}/>{i===ageBand&&<path d={`m${21+(i%2)*16} ${36+Math.floor(i/2)*13} 2 2 4-4`} fill="none" stroke="white" strokeWidth="1.4"/>}</g>)}<path d="m47 47 10 3-3 10-10-3Z" fill={leaf} stroke={ink} strokeWidth="1.5"/><path d="m48 53 4 1" stroke="#E8F4E5" strokeWidth="1.5"/></>;
        break;
      }
      scene=<><path d="M12 55c0-13 8-20 20-20s20 7 20 20" fill={leaf} stroke={ink} strokeWidth="2"/>{feminine?<path d="M17 34V25c0-12 6-18 15-18s15 6 15 18v13l-10 4-11-2Z" fill={hair}/>:<path d="M19 27V20c0-8 6-13 14-13 8 0 14 5 14 13v8" fill={hair}/>}<path d="M27 33v9c2 4 8 4 10 0v-9" fill="#DDAE8C" stroke={ink} strokeWidth="1.6"/><path d="M21 22c0-8 22-9 22 0v6c0 9-5 13-11 13s-11-5-11-13Z" fill="#EBC4A0" stroke={ink} strokeWidth="1.7"/><path d={feminine?'M20 24c-1-12 17-18 24-4-6 2-9-1-12-6-1 5-5 8-12 10Z':'M20 23c-1-9 4-14 12-14 7 0 13 5 12 13-7 0-9-3-11-7-1 5-7 8-13 8Z'} fill={hair}/><path d="M27 44v11m10-11v11" stroke="#A2D6BF" strokeWidth="2"/><path d="M29 32c2 2 4 2 6 0" fill="none" stroke="#A76C56" strokeWidth="1.5"/></>;
      break;
    case 'lock':
    case 'unlock':
      scene=<><path d={name==='unlock'?'M21 28v-9C21 3 45 3 45 19':'M21 28v-9c0-16 24-16 24 0v9'} fill="none" stroke={ink} strokeWidth="7"/><path d="M21 28v-9c0-16 24-16 24 0" fill="none" stroke="#9CAEA3" strokeWidth="3"/><rect x="12" y="26" width="42" height="30" rx="6" fill={gold} stroke={ink} strokeWidth="2"/><path d="M16 30h34v7H16" fill="#FFE9A2"/><circle cx="33" cy="40" r="4" fill={ink}/><path d="M33 42v7" stroke={ink} strokeWidth="4"/>{name==='unlock'?<><circle cx="50" cy="48" r="10" fill={leaf} stroke={ink} strokeWidth="1.5"/><path d="m45 48 3 3 6-7" fill="none" stroke="white" strokeWidth="2.4"/></>:<path d="m48 47 7 4-7 7-7-4Z" fill={leaf} stroke={ink} strokeWidth="1.4"/>}</>;
      break;
    case 'sprout':
      scene=<><path d="M31 40V22" stroke={ink} strokeWidth="2.5"/><path d="M31 29C14 30 11 19 11 12c15-1 22 6 20 17Z" fill={leaf} stroke={ink} strokeWidth="1.7"/><path d="M32 23C33 8 44 6 53 9c-1 12-8 20-21 14Z" fill="#A6D0A4" stroke={ink} strokeWidth="1.7"/><path d="m19 20 12 9m1-6 12-8" fill="none" stroke={green} strokeWidth="1.6"/><path d="m18 38 4 19h21l4-19" fill={gold} stroke={ink} strokeWidth="2"/><rect x="16" y="35" width="33" height="7" rx="2" fill="#FFE29B" stroke={ink} strokeWidth="1.7"/><path d="m25 47 1 6" stroke="#FFF0B9" strokeWidth="3"/></>;
      break;
    case 'repeat':
      scene=<><path d="M13 24c3-11 17-17 28-11l9 6m-1-9 1 9-10 1" fill="none" stroke={green} strokeWidth="4"/><path d="M52 42c-5 12-18 17-29 11l-9-7m0 10V46l10-1" fill="none" stroke="#D4AC40" strokeWidth="4"/><path d="m21 25 21-2 3 23-21 2Z" fill={paper} stroke={ink} strokeWidth="2"/><path d="m27 32 10-1m-9 7 9-1" stroke={blue} strokeWidth="2"/><circle cx="41" cy="41" r="7" fill={gold} stroke={ink} strokeWidth="1.5"/></>;
      break;
    case 'book':
      scene=<><path d="M8 17c8-4 17-4 24 1 8-5 17-5 25-1v36c-8-4-17-3-25 2-7-5-16-6-24-2Z" fill={gold} stroke={ink} strokeWidth="2"/><path d="M10 12c8-3 15-2 22 3 8-5 15-6 23-3v36c-8-3-15-2-23 3-7-5-14-6-22-3Z" fill={paper} stroke={ink} strokeWidth="2"/><path d="M32 16v34M16 23l10 2m-10 6 10 2m-10 6 10 2m12-17 10-2m-10 10 10-2m-10 10 7-2" fill="none" stroke="#A4B4A5" strokeWidth="1.5"/><path d="m42 10 6-1v17l-3-3-3 4Z" fill={leaf}/></>;
      break;
    case 'heart':
      scene=<><path d="M32 48 13 30C0 17 19 3 32 18 45 3 65 17 51 31Z" fill="#E4A087" stroke={ink} strokeWidth="2"/><path d="M16 22c0-5 5-7 9-4" fill="none" stroke="#F9D6BC" strokeWidth="3"/><path d="m8 43 11-3 10 6h8l11-6 9 5-16 13H24L8 49Z" fill={gold} stroke={ink} strokeWidth="1.8"/><path d="M20 46h17c5 0 5 6 0 6h-9" fill="none" stroke={ink} strokeWidth="1.5"/></>;
      break;
    case 'shield':
      scene=<><path d="M32 8 53 16v17c0 13-11 23-21 27-10-4-21-14-21-27V16Z" fill={leaf} stroke={ink} strokeWidth="2"/><path d="m32 13 16 6v14c0 10-8 18-16 22-8-4-16-12-16-22V19Z" fill="#D8EDDA"/><path d="M32 13v42c8-4 16-12 16-22V19Z" fill="#B1D7BE"/><path d="m23 32 7 7 13-15" fill="none" stroke={green} strokeWidth="4"/><circle cx="51" cy="47" r="9" fill={gold} stroke={ink} strokeWidth="1.5"/><path d="M51 42v10m-4-5h8" stroke="#8F701D" strokeWidth="1.8"/></>;
      break;
    case 'flag':
      scene=<><path d="m6 58 15-19 8 6 11-13 18 26" fill="#C9DFCB" stroke={ink} strokeWidth="1.7"/><path d="m21 39 8 6 11-13 18 26H32Z" fill="#96BEAA"/><path d="M39 36V7" stroke={ink} strokeWidth="2.7"/><path d="M40 8c8-6 14 6 21 0v19c-7 6-13-6-21 0Z" fill={gold} stroke={ink} strokeWidth="1.7"/><path d="m44 13 7 3 5-2" fill="none" stroke="#FFF4C9" strokeWidth="2"/><path d="m14 50 7-8 5 5" fill="none" stroke="#F4F5E7" strokeWidth="2"/></>;
      break;
    case 'zap':
      scene=<><rect x="9" y="21" width="45" height="29" rx="5" fill={paper} stroke={ink} strokeWidth="2"/><path d="M54 29h5v13h-5" fill={ink}/><rect x="14" y="26" width="11" height="19" rx="2" fill="#A7CFB6"/><path d="m35 7-14 26h11l-5 24 20-30H35l7-20Z" fill={gold} stroke={ink} strokeWidth="2"/><path d="m33 18-5 11h10" fill="none" stroke="#FFF1B2" strokeWidth="2"/></>;
      break;
    case 'clock':
      scene=<><path d="m17 51-3 6m33-6 3 6M22 8l-6-3m26 3 6-3" fill="none" stroke={ink} strokeWidth="3"/><path d="M9 13c3-7 9-10 16-7l-9 13Zm31-7c7-3 13 0 16 7l-7 6Z" fill={gold} stroke={ink} strokeWidth="1.7"/><circle cx="32" cy="33" r="24" fill={gold} stroke={ink} strokeWidth="2"/><circle cx="32" cy="33" r="19" fill={paper} stroke={ink} strokeWidth="1.5"/><path d="M32 18v3m15 12h-3M32 48v-3M17 33h3" stroke="#94A397" strokeWidth="1.6"/><path d={minuteHand} fill="none" stroke={ink} strokeWidth="2.5"/><circle cx="32" cy="33" r="3" fill={green}/><path d="m51 48 6-2" stroke={green} strokeWidth="2"/></>;
      break;
    case 'sparkles':
      scene=<><path d="m12 53 23-26 7 6-23 26Z" fill={leaf} stroke={ink} strokeWidth="2"/><path d="m28 35 7-8 7 6-7 8Z" fill={paper} stroke={ink} strokeWidth="1.5"/><path d="m39 7 4 11 12 3-12 4-4 12-4-12-12-4 12-3Z" fill={gold} stroke={ink} strokeWidth="1.6"/><path d="m15 12 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#A8CFC0"/><path d="m51 39 2 5 6 2-6 2-2 6-2-6-5-2 5-2Z" fill={coral}/></>;
      break;
    case 'trophy':
      scene=<><path d="M18 15H8v9c0 10 7 15 16 15m22-24h10v9c0 10-7 15-16 15" fill="none" stroke={ink} strokeWidth="5"/><path d="M18 15H8v9c0 10 7 15 16 15m22-24h10v9c0 10-7 15-16 15" fill="none" stroke="#E1B74B" strokeWidth="2.5"/><path d="M18 9h28v16c0 10-6 16-14 16s-14-6-14-16Z" fill={gold} stroke={ink} strokeWidth="2"/><path d="M25 12v13c0 5 2 9 5 11" fill="none" stroke="#FFF1B5" strokeWidth="3"/><path d="M29 41h6v9h-6Z" fill="#C5A043" stroke={ink} strokeWidth="1.5"/><path d="M22 49h20v6H22Z" fill={gold} stroke={ink} strokeWidth="1.7"/><rect x="17" y="55" width="30" height="6" rx="2" fill={green} stroke={ink} strokeWidth="1.5"/></>;
      break;
    case 'home':
      scene=<><path d="m13 29 20-17 20 17v28H13Z" fill={paper} stroke={ink} strokeWidth="2"/><path d="m8 29 25-22 25 22-5 5-20-18-20 18Z" fill={leaf} stroke={ink} strokeWidth="1.8"/><path d="M22 38h12v19H22Z" fill={gold} stroke={ink} strokeWidth="1.7"/><path d="M40 36h8v8h-8Z" fill="#B6D6DD" stroke={ink} strokeWidth="1.5"/><circle cx="30" cy="48" r="1.5" fill={ink}/><path d="m46 48-10 9m2-2 2 3m1-6 3 3" fill="none" stroke={ink} strokeWidth="4"/><circle cx="49" cy="45" r="6" fill={gold} stroke={ink} strokeWidth="2"/></>;
      break;
    case 'plane':
      scene=<><path d="m11 38 13 5 17-4 13 4v15l-13-4-17 4-13-5Z" fill={paper} stroke={ink} strokeWidth="1.8"/><path d="M24 43v15m17-19v15" stroke="#CBD6C8" strokeWidth="1.5"/><path d="m16 49 12 3 10-7 11 4" fill="none" stroke={green} strokeWidth="1.7" strokeDasharray="2 4"/><path d="m10 23 18-3L42 7c4-4 9-1 7 3l-9 14 15 9-4 4-18-5-10 8-5-2 5-10-13-1Z" fill={gold} stroke={ink} strokeWidth="1.8"/><path d="m36 18 7-8" stroke="#FFF3C1" strokeWidth="2.5"/><circle cx="48" cy="49" r="3" fill={coral}/></>;
      break;
    case 'play':
      scene=<><path d="M12 21h40v34H12Z" fill={gold} stroke={ink} strokeWidth="2"/><path d="m9 15 39-7 2 10-39 7Z" fill={ink} stroke={ink} strokeWidth="2"/><path d="m17 14 6 9m5-11 6 9m5-11 6 9" stroke="#F2E8BC" strokeWidth="5"/><path d="M12 26h40" stroke={ink} strokeWidth="2"/><circle cx="32" cy="40" r="11" fill={paper}/><path d="m29 34 9 6-9 6Z" fill={green}/><path d="M18 49h6m18 0h5" stroke="#C2972A" strokeWidth="1.6"/></>;
      break;
    default:
      scene=<><circle cx="32" cy="32" r="23" fill={gold} stroke={ink} strokeWidth="2"/><path d="m32 14 5 13 13 5-13 5-5 13-5-13-13-5 13-5Z" fill={paper} stroke={ink} strokeWidth="1.7"/><circle cx="32" cy="32" r="5" fill={leaf}/></>;
  }
  const dimensions=size==='large'?96:48;
  return <svg className={`quiz-illustration quiz-illustration--${size}`} data-illustration={name} width={dimensions} height={dimensions} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-gold`} x1="10" y1="8" x2="53" y2="60" gradientUnits="userSpaceOnUse"><stop stopColor="#FFE99B"/><stop offset="1" stopColor="#E9B938"/></linearGradient>
      <linearGradient id={`${id}-paper`} x1="20" y1="12" x2="42" y2="55" gradientUnits="userSpaceOnUse"><stop stopColor="#FFFDF4"/><stop offset="1" stopColor="#EDF0E7"/></linearGradient>
      <linearGradient id={`${id}-green`} x1="18" y1="12" x2="47" y2="56" gradientUnits="userSpaceOnUse"><stop stopColor="#79BE9B"/><stop offset="1" stopColor="#268365"/></linearGradient>
    </defs>
    <path d="M8 40C4 21 18 6 38 7c22-2 37 14 35 34 1 19-12 32-34 31C19 73 6 60 8 40Z" fill="#F7F2DC"/>
    <path d="m64 15 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#E2BC4E" opacity=".7"/>
    <circle cx="12" cy="57" r="2.5" fill="#A5CDB5"/>
    <g className="illustration-art" transform="translate(8 7)" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="32" cy="59" rx="23" ry="3" fill="#435846" opacity=".10"/>
      {scene}
    </g>
  </svg>;
}
