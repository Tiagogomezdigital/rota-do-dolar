import {useId} from 'react';

/** Illustrative learning stages, rather than a prediction of earnings. */
export function JourneyChart(){
  const id=useId().replace(/:/g,'');
  const gradient=`${id}-journey-gradient`;
  const curve='M80 284 C200 278 278 266 373 228 C474 188 565 122 666 32';
  return <div className="journey-chart">
    <svg viewBox="0 0 720 380" role="img" aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>Sua jornada nos próximos 30 dias</title>
      <desc id={`${id}-description`}>Ilustração das etapas de aprendizagem em escala relativa de 0 a 100: ontem, ponto de partida; hoje, conhecer a estrutura; em 30 dias, aprender e aplicar. O marcador Você destaca o momento atual. Não representa rendimentos nem uma previsão de resultados.</desc>
      <defs>
        <linearGradient id={gradient} x1="80" y1="0" x2="666" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ef2828"/>
          <stop offset=".3" stopColor="#ff9026"/>
          <stop offset=".52" stopColor="#dfbc20"/>
          <stop offset="1" stopColor="#22bb62"/>
        </linearGradient>
      </defs>
      <g className="journey-chart-grid" fill="none" stroke="#b5b5b5" strokeWidth="1.5" strokeDasharray="4 5">
        {[32,102,172,242,312].map(y=><path key={y} d={`M80 ${y}H666`}/>)}
        {[80,373,666].map(x=><path key={x} d={`M${x} 32V312`}/>)}
      </g>
      <path d={`${curve} V312 H80Z`} fill={`url(#${gradient})`} opacity=".56"/>
      <path d={curve} fill="none" stroke={`url(#${gradient})`} strokeWidth="5.5" strokeLinecap="round"/>
      <g className="journey-chart-ticks" textAnchor="end">
        {[100,75,50,25,0].map((value,i)=><text key={value} x="58" y={39+i*70}>{value}</text>)}
      </g>
      {[
        {x:80,y:284,color:'#de2027',radius:9},
        {x:373,y:228,color:'#e4ab0d',radius:12},
        {x:666,y:32,color:'#14b459',radius:9},
      ].map(({x,y,color,radius})=><g key={x}>
        <circle cx={x} cy={y} r="21" fill="#000" opacity=".10"/>
        <circle cx={x} cy={y} r={radius} fill={color}/>
      </g>)}
      <rect x="333" y="158" width="80" height="42" rx="10" fill="#ffc324"/>
      <text className="journey-chart-you" x="373" y="187" textAnchor="middle">Você</text>
      <g className="journey-chart-stages">
        <text x="80" y="358" textAnchor="start">Ontem</text>
        <text x="373" y="358" textAnchor="middle">Hoje</text>
        <text x="666" y="358" textAnchor="end">30 DIAS</text>
      </g>
    </svg>
  </div>;
}
