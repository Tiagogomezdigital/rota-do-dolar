/** Keep previous sessions separate when question meanings or options change. */
export const CONTENT_VERSION = 'rota-dolar-v2';
export const content = {
  brand: 'ROTA DO DÓLAR',
  preview: false,
  hero: {
    eyebrow: 'COM TIAGO GOMES',
    title: 'Sua próxima fonte de renda',
    highlight: 'pode ser em dólar.',
    description: 'Conheça a agência com inteligência artificial do Tiago Gomes: estrutura pronta e comissões em dólar, sem precisar aparecer em vídeos. Descubra seu ponto de partida, mesmo começando do zero.',
    cta: 'Descobrir minha rota',
    imageUrl: '/tiago-gomes/images/tiago-momentos-hero.png',
  },
  expert: {
    name: 'Tiago Gomes',
    description: 'Para mim, conquistar mais nunca foi só sobre dinheiro. Foi sobre poder cuidar da minha mãe, estar com minha esposa e minha filha e ter mais escolhas. É essa mudança de perspectiva que eu quero apresentar a você.',
    cta: 'Entender a rota que combina comigo',
  },
  offer: {
    title: 'O dólar pode fazer parte da sua próxima rota.',
    description: 'Tiago vai mostrar a proposta da Rota do Dólar: uma estrutura de agência com inteligência artificial e um modelo de comissões em dólar. Entenda o funcionamento antes de decidir começar.',
    videoUrl: '', checkoutUrl: '', cta: 'Tenho interesse na Rota do Dólar',
  },
};
export type Option = {id:string;label:string;icon:string;description?:string};
export type Question = {id:string;title:string;label:string;description:string;options:Option[]};
const option = (id:string,label:string,icon:string,description?:string):Option => ({id,label,icon,description});
export const questions:Question[] = [
  {id:'momento',label:'Seu momento',title:'Hoje, de onde vem a sua renda?',description:'Uma nova fonte de renda precisa caber na sua vida atual.',options:[option('clt','Tenho um emprego e quero renda extra','briefcase'),option('autonomo','Trabalho por conta e quero ganhar mais','chart'),option('sem-renda','Estou buscando uma fonte de renda','search'),option('digital','Já trabalho no digital e quero uma nova rota','compass')]},
  {id:'experiencia',label:'Sua experiência',title:'Você já tentou ganhar dinheiro pela internet?',description:'Se algo não funcionou antes, isso também faz parte do seu ponto de partida.',options:[option('primeira','Ainda não. Quero começar do zero','sprout'),option('tentativa','Já tentei, mas não consegui avançar','repeat'),option('aprendendo','Estou aprendendo e ainda falta clareza','book'),option('pratica','Já tenho experiência e quero diversificar','chart')]},
  {id:'motivacao',label:'O que importa',title:'O que uma nova renda mudaria primeiro na sua vida?',description:'Pense na conquista que faria diferença de verdade.',options:[option('contas','Ter mais fôlego para as contas','shield'),option('familia','Dar mais conforto à minha família','heart'),option('liberdade','Depender menos de uma única renda','compass'),option('projeto','Tirar um plano pessoal do papel','flag')]},
  {id:'obstaculo',label:'Sua maior barreira',title:'O que mais te trava na hora de começar?',description:'Vamos olhar para o que você precisa entender antes de dar o próximo passo.',options:[option('direcao','Não sei o que fazer primeiro','compass'),option('seguranca','Tenho receio de investir e me frustrar','shield'),option('tecnologia','A parte de tecnologia parece complicada','book'),option('tempo','Minha rotina já está cheia','clock')]},
  {id:'exposicao',label:'Sem precisar aparecer',title:'Como você se sente em aparecer em vídeos?',description:'A proposta da Rota do Dólar não depende de transformar você em influenciador.',options:[option('privacidade','Prefiro trabalhar sem me expor','lock'),option('inseguro','Tenho vergonha ou insegurança','user'),option('indiferente','Não seria um problema para mim','check')]},
  {id:'ia',label:'Uma nova ferramenta',title:'A inteligência artificial já faz parte da sua rotina?',description:'Você não precisa chegar sabendo tudo. Queremos saber por onde começar a explicação.',options:[option('zero','Ainda não usei','sprout'),option('curioso','Já ouvi falar, mas não sei usar','search'),option('ocasional','Uso de vez em quando','zap'),option('rotina','Já uso no trabalho ou nos estudos','book')]},
  {id:'estrutura',label:'Seu ponto de partida',title:'O que você tem disponível para começar?',description:'A apresentação vai mostrar a estrutura e o que é necessário para utilizá-la.',options:[option('celular','Meu celular com internet','phone'),option('computador','Um computador com internet','monitor'),option('ambos','Celular e computador','check')]},
  {id:'tempo',label:'Seu ritmo',title:'Quanto tempo você consegue reservar por dia?',description:'Escolha um ritmo possível para você manter. Aprender e colocar em prática exige dedicação.',options:[option('15-30','De 15 a 30 minutos','clock'),option('30-60','De 30 minutos a 1 hora','clock'),option('1-2h','De 1 a 2 horas','clock'),option('2h+','Mais de 2 horas','clock')]},
];
export const PROCESS_STEP = questions.length+1;
export const STORY_STEP = questions.length+2;
export const RESULT_STEP = questions.length+3;
export const OFFER_STEP = questions.length+4;
export const stepNames = ['Abertura',...questions.map(q=>q.label),'Organizando respostas','Tiago Gomes','Sua rota','Apresentação'];
export function getSuggestion(answers:Record<string,string>) {
  const experience = answers.experiencia==='pratica'
    ? {title:'Uma nova rota para quem já começou.',text:'Você já conhece o digital. Vale olhar para o modelo de agência com IA e entender como ele se diferencia do que você faz hoje.'}
    : answers.experiencia==='tentativa'
      ? {title:'Mais clareza para a sua próxima tentativa.',text:'Você já tentou antes. Na apresentação, foque no funcionamento da agência, nas tarefas do dia a dia e nas condições para receber comissões.'}
      : {title:'Um começo que você consiga entender.',text:'Seu próximo passo é conhecer como a estrutura de agência com IA funciona e o que você precisa fazer. Uma explicação clara vem antes de qualquer decisão.'};
  const priorities:Record<string,string>={direcao:'Comece pelo passo a passo: o que a agência faz e qual é a sua parte.',seguranca:'Observe as condições, os custos e os critérios de comissão antes de decidir.',tecnologia:'Veja a estrutura em uso e quais ferramentas você precisará aprender.',tempo:'Compare as tarefas da operação com o tempo que você consegue reservar.'};
  const motivations:Record<string,string>={contas:'Mais fôlego para as contas',familia:'Mais conforto para sua família',liberdade:'Uma alternativa à renda atual',projeto:'Um plano pessoal saindo do papel'};
  const device=answers.estrutura==='celular'?'Celular com internet':answers.estrutura==='computador'?'Computador com internet':'Celular e computador';
  const time=questions.find(q=>q.id==='tempo')?.options.find(o=>o.id===answers.tempo)?.label||'Seu ritmo';
  return {...experience,priority:priorities[answers.obstaculo]||priorities.direcao,goal:motivations[answers.motivacao]||'Uma nova fonte de renda',device,time,ai:answers.ia==='zero'||answers.ia==='curioso'?'IA explicada desde o início':'Aplicação prática da IA',privacy:answers.exposicao==='indiferente'?'Modelo sem depender de seguidores':'Uma proposta sem precisar aparecer'};
}
