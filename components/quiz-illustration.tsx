type IllustrationProps = {
  name?:string;
  emoji?:string;
  size?:'small'|'large';
};

const emojis:Record<string,string>={
  gift:'🎁', check:'✅', close:'❌', compass:'🧭', briefcase:'💼',
  search:'🔍', chart:'📈', phone:'📱', monitor:'🖥️', user:'👤',
  lock:'🔒', unlock:'🔓', sprout:'🌱', repeat:'🔄', book:'📖',
  heart:'❤️', shield:'🛡️', flag:'🚩', zap:'⚡', clock:'⏰',
  sparkles:'✨', trophy:'🏆', home:'🏠', plane:'✈️', play:'▶️',
  globe:'🌎', loading:'⏳',
};

/** Decorative emojis accompany the existing accessible labels. */
export function QuizIllustration({name,emoji,size='small'}:IllustrationProps){
  const symbol=emoji??emojis[name??'']??'✨';
  return <span className={`quiz-illustration quiz-illustration--${size}`} data-illustration={name} aria-hidden="true">{symbol}</span>;
}
