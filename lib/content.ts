/** Separate editions preserve the original meaning of previously collected answers. */
export const CONTENT_VERSION = 'rota-dolar-v4-20261023';
export const PROCESS_DURATION_MS = 7000;
export type VturbConfig = {id:string;scriptUrl:string;mediaPreloadUrl:string};
export type VideoConfig = {src:string; embedUrl:string; revealAtSeconds:number|null;vturb?:VturbConfig;ctaMode?:'immediate'|'after-playback'};
export const content = {
  brand:'ROTA DO DÓLAR', preview:false,
  hero:{
    eyebrow:'COM TIAGO GOMEZ',
    title:'Descubra Como Pessoas Comuns Estão Fazendo De',
    highlight:'$100 a $500 Dólares',
    ending:'Por Dia Com Um Método Simples Que Você Pode Começar',
    closingHighlight:'AINDA HOJE',
    description:'Sem vender nada, sem conhecimento técnico, sem aparecer, sem investir em anúncios e sem precisar de seguidores...',
    socialProof:{firstLine:'Mais de 1.840 pessoas já ativaram',secondLine:'esse fluxo de comissões em dólar neste mês'},
    cta:'🏁 COMEÇAR AGORA',
    imageUrl:'/tiago-gomes/images/tiago-rota-do-dolar-1536.webp',
    imageSrcSet:'/tiago-gomes/images/tiago-rota-do-dolar-576.webp 576w, /tiago-gomes/images/tiago-rota-do-dolar-960.webp 960w, /tiago-gomes/images/tiago-rota-do-dolar-1536.webp 1536w',
    imageAvifSrcSet:'/tiago-gomes/images/optimized/tiago-rota-do-dolar-576.bb46527de47c.avif 576w, /tiago-gomes/images/optimized/tiago-rota-do-dolar-768.ba52d97371ac.avif 768w, /tiago-gomes/images/optimized/tiago-rota-do-dolar-960.a756fcdf0985.avif 960w, /tiago-gomes/images/optimized/tiago-rota-do-dolar-1152.c514d3379b93.avif 1152w, /tiago-gomes/images/optimized/tiago-rota-do-dolar-1536.dc500ec7a3e1.avif 1536w',
  },
  expert:{
    name:'Tiago Gomez', title:'MUITO PRAZER, MEU NOME É TIAGO GOMEZ',
    imageUrl:'/tiago-gomes/images/tiago-momentos-hero-1536.webp',
    imageSrcSet:'/tiago-gomes/images/tiago-momentos-hero-576.webp 576w, /tiago-gomes/images/tiago-momentos-hero-960.webp 960w, /tiago-gomes/images/tiago-momentos-hero-1536.webp 1536w',
    imageAvifSrcSet:'/tiago-gomes/images/optimized/tiago-momentos-hero-576.778cdcb85b8d.avif 576w, /tiago-gomes/images/optimized/tiago-momentos-hero-768.b7d4f5340b28.avif 768w, /tiago-gomes/images/optimized/tiago-momentos-hero-960.c5058aa5a02f.avif 960w, /tiago-gomes/images/optimized/tiago-momentos-hero-1152.54e323645850.avif 1152w, /tiago-gomes/images/optimized/tiago-momentos-hero-1536.03a66a8cf479.avif 1536w',
    paragraphs:[
      'Quando você cresce vendo a dor de perto, a vida te obriga a escolher rápido: ser a vítima das circunstâncias ou o herói das próximas gerações. Eu escolhi lutar. Sem desculpas e sem negociar com o trabalho duro.',
      'O mercado digital me tirou da comunidade e me colocou no topo. Mas a verdadeira sabedoria veio de errar, consertar, descentralizar e construir um império que opera em diversas frentes no Brasil e lá fora, faturando milhões com inteligência e escala.',
      'Se você está cansado de viver no limite e quer um método testado por quem já esteve no fundo do poço e construiu o próprio império, você está no lugar certo.',
    ], cta:'QUERO ACESSAR O MÉTODO AGORA',
  },
  result:{
    cta:'🔓 DESBLOQUEAR O MEU ACESSO AGORA',
    comparison:{today:'Onde se encontra hoje:',future:'Onde vai estar daqui a 30 dias:'},
    accessBanner:{
      src:'/assets/acesso-liberado-protocolo-dolar-1240.webp',
      srcSet:'/assets/acesso-liberado-protocolo-dolar-620.webp 620w, /assets/acesso-liberado-protocolo-dolar-1240.webp 1240w',
      alt:'O seu acesso ao Protocolo Dólar com IA foi libertado por tempo limitado!',
    },
    partnerBanner:{
      src:'/assets/banner-premium-parceiro-ia-1240.webp',
      srcSet:'/assets/banner-premium-parceiro-ia-620.webp 620w, /assets/banner-premium-parceiro-ia-1240.webp 1240w',
      alt:'Para desbloquear o seu acesso ao Sistema de Parceiro IA, clique no botão abaixo e assista à aula prática com o passo a passo completo.',
    },
  },
  offer:{
    title:{intro:'Copie e Cole a Minha Estrutura Para Gerar de',highlight:'$50 a $250',unit:'Dólares Por Dia',ending:'Com IA Sem Precisar Vender NADA'},
    description:'Assista ao vídeo de 3 minutos e veja como replicar essa estratégia simples AINDA HOJE',
    video:{src:'',embedUrl:'',revealAtSeconds:null,ctaMode:'immediate',vturb:{
      id:'vid-6ae294ffa91a049aa976d63f',
      scriptUrl:'https://scripts.converteai.net/17e48d12-3707-41cc-ae3c-447e3b6608f8/players/6ae294ffa91a049aa976d63f/v4/player.js',
      mediaPreloadUrl:'https://cdn.converteai.net/17e48d12-3707-41cc-ae3c-447e3b6608f8/6ae294ec47517e58ab41e429/main.m3u8',
    }} as VideoConfig,
    checkoutUrl:'https://pay.kiwify.com.br/14n3TC2?src=gula', cta:'QUERO GANHAR EM DÓLAR',
    notice:{text:'Após assistir o vídeo, aperte no botão abaixo, antes que as',emphasis:'vagas encerrem...'},
  },
  thanks:{
    title:'IMPORTANTE: ESTA AULA SÓ ESTÁ DISPONÍVEL AQUI',
    video:{src:'',embedUrl:'',revealAtSeconds:null} as VideoConfig,
    destination:'https://affiliates.express/rotadodolar', cta:'LIBERAR AFILIAÇÃO NA WIX',
  },
};
export type Option={id:string;label:string;icon:string;description?:string};
export type Question={id:string;title:string;label:string;description:string;options:Option[]};
const option=(id:string,label:string,icon:string,description?:string):Option=>({id,label,icon,description});
export const questions:Question[]=[
  {id:'compromisso',label:'Seu acesso',title:'Compromete-se a responder a este questionário rápido com total atenção?',description:'Se pretende desbloquear o PRESENTE SECRETO, o modelo pronto para ativar comissões de $50 dólares, conclua as etapas seguintes.',options:[option('sim','Sim, quero o meu acesso','✅'),option('nao','Não tenho interesse','🚫')]},
  {id:'genero',label:'Sobre você',title:'Você é?',description:'Selecione uma opção para continuar.',options:[option('homem','Homem','👨'),option('mulher','Mulher','👩')]},
  {id:'idade',label:'Sua idade',title:'Qual sua idade?',description:'Em qual faixa você está?',options:[option('15-25','15 a 25 anos','🧑'),option('26-35','26 a 35 anos','👨'),option('36-45','36 a 45 anos','🧔'),option('46+','46+ anos','🧓')]},
  {id:'momento',label:'Sua realidade',title:'Qual dessas frases mais combina com você hoje?',description:'Escolha a mais próxima da sua realidade.',options:[option('clt','Trabalho CLT e quero renda extra','💼'),option('sem-renda','Estou desempregado(a) buscando oportunidade','🔎'),option('autonomo','Sou autônomo(a) querendo aumentar a renda','🛠️'),option('digital','Estou buscando liberdade no digital','💻')]},
  {id:'experiencia',label:'Suas tentativas',title:'Você já tentou ganhar dinheiro online antes?',description:'Conte qual experiência mais combina com a sua.',options:[option('afiliado','Já tentei ser afiliado no Brasil e não funcionou','🤝'),option('anuncios','Já perdi dinheiro com anúncios','💸'),option('complicado','Já tentei, mas os métodos eram complicados demais','🧩'),option('primeira','Nunca tentei, mas tenho medo de aparecer em vídeos','🙈')]},
  {id:'motivacao',label:'Sua motivação',title:'O que te MOTIVA a querer ganhar dinheiro online agora?',description:'Pense no que faria diferença na sua vida.',options:[option('dividas','Pagar as dívidas e sair do vermelho','🧾'),option('independencia','Conquistar a independência financeira','🗽'),option('sonho','Realizar um sonho específico','🌠'),option('familia','Ter mais tempo com a família','👨‍👩‍👧‍👦'),option('padrao','Melhorar meu padrão de vida','🏡')]},
  {id:'sentimento',label:'Como você se sente',title:'Qual dessas frases mais descreve como você se sente hoje?',description:'Escolha a que mais representa seu momento.',options:[option('frustrado','Frustrado(a). Já tentei e não deu','😞','Mas quero uma chance real'),option('confuso','Confuso(a). Não sei por onde começar','😕','Mas vou aprender o certo'),option('cetico','Cético(a). Parece bom demais','🤨','Mas quero ver funcionando'),option('inseguro','Animado(a), mas inseguro(a)','😬','Tenho medo de perder dinheiro'),option('urgencia','Desesperado(a). Preciso de resultado agora','😰','Vou fazer o necessário')]},
  {id:'renda',label:'Sua renda atual',title:'Você está satisfeito(a) com sua renda atual?',description:'Como você vê sua situação hoje?',options:[option('mais','Não. Preciso ganhar mais agora','📈','Vou mudar minha situação'),option('receio','Não. Tenho medo de arriscar','😟','Mesmo assim vou tentar ser diferente'),option('melhor','Poderia ser melhor','💰','Quero renda extra sem complicação'),option('sem-renda','Não tenho renda hoje','🌱','Vou buscar minha primeira comissão')]},
  {id:'obstaculo',label:'Seu principal obstáculo',title:'O que te IMPEDIU de ganhar dinheiro online até agora?',description:'Selecione o principal obstáculo.',options:[option('direcao','Não sabia por onde começar','🧭'),option('anuncios','Perdi dinheiro com anúncios','📉'),option('complexidade','Métodos muito complicados','🧩'),option('exposicao','Medo de aparecer em vídeos','🫣'),option('recursos','Falta de tempo e dinheiro para investir','⌛'),option('tentativa','Tentei e não funcionou','🔁')]},
  {id:'sonho',label:'Seu sonho de vida',title:'Qual é o seu sonho de vida que o dinheiro tornaria possível?',description:'Imagine que você está ganhando $300 por dia com meu método.',options:[option('viagem','Viajar o mundo sem preocupação','✈️'),option('casa-carro','Comprar a casa ou o carro dos meus sonhos','🏠'),option('familia','Dar uma vida melhor para quem eu amo','❤️'),option('liberdade','Sair do CLT e conquistar mais liberdade','🕊️'),option('seguranca','Ter tranquilidade e segurança financeira','🛡️'),option('pessoal','Investir em mim mesmo(a)','📚')]},
  {id:'meta',label:'Sua meta',title:'Quanto você quer estar GANHANDO por dia daqui a 30 dias?',description:'Seja ambicioso(a), mas realista com seu esforço. A escolha representa seu objetivo, não uma previsão de ganhos.',options:[option('50-300','Entre $50 e $300 por dia','💵'),option('450-700','Entre $450 e $700 por dia','💰'),option('750-1000','Entre $750 e $1.000 por dia','💎'),option('1000-2000','Entre $1.000 e $2.000 por dia','🏆'),option('3000+','Acima de $3.000 por dia','🚀')]},
  {id:'tempo',label:'Sua dedicação',title:'Quanto tempo POR DIA você pode dedicar ao método?',description:'Escolha o tempo que consegue reservar na sua rotina.',options:[option('10-30','Entre 10 e 30 minutos','⏱️'),option('1-2h','Entre 1 e 2 horas','🕑'),option('2-3h','Entre 2 e 3 horas','🕒'),option('4h+','Mais de 4 horas','🕓')]},
];
export const PROCESS_STEP=questions.length+1;
export const STORY_STEP=questions.length+2;
export const RESULT_STEP=questions.length+3;
export const OFFER_STEP=questions.length+4;
export const DECLINED_STEP=questions.length+5;
export const stepNames=['Abertura',...questions.map(q=>q.label),'Preparando sua jornada','Tiago Gomez','Sua jornada em 30 dias','Aula prática','Não tenho interesse'];
export function getSuggestion(answers:Record<string,string>){
  const chosen=(id:string)=>questions.find(q=>q.id===id)?.options.find(o=>o.id===answers[id])?.label||'Não informado';
  const priorities:Record<string,string>={direcao:'Comece pelo passo a passo da estrutura pronta e entenda a primeira tarefa antes de avançar.',anuncios:'Observe como funciona a captação sem investir em anúncios e quais custos fazem parte da operação.',complexidade:'Veja como a estrutura pronta e a IA entram em cada etapa, sem precisar criar tudo do zero.',exposicao:'Veja como o modelo funciona sem gravar vídeos nem expor sua imagem.',recursos:'Compare o tempo e os custos apresentados com o que você pode dedicar hoje.',tentativa:'Entenda o que muda em relação às tentativas anteriores e confira as condições das comissões.'};
  return {goal:chosen('motivacao'),dream:chosen('sonho'),dailyTarget:chosen('meta'),time:chosen('tempo'),priority:priorities[answers.obstaculo]||priorities.direcao};
}
