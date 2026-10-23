/** Separate editions preserve the original meaning of previously collected answers. */
export const CONTENT_VERSION = 'rota-dolar-v4-20261023';
export const PROCESS_DURATION_MS = 7000;
export type VideoConfig = {src:string; embedUrl:string; revealAtSeconds:number|null};
export const content = {
  brand:'ROTA DO DÓLAR', preview:false,
  hero:{
    eyebrow:'COM TIAGO GOMEZ',
    title:'Descubra Como Pessoas Comuns Estão Fazendo De',
    highlight:'$100 a $500 Dólares Por Dia',
    ending:'Sem Vender Absolutamente Nada Com Um Método Simples Que Você Pode Começar AINDA HOJE',
    description:'Sem conhecimento técnico, sem aparecer, sem investir em anúncios e sem precisar de seguidores',
    socialProof:'Mais de 1.840 pessoas já ativaram esse fluxo de comissões em dólar neste mês',
    cta:'QUERO RECEBER EM DÓLAR AGORA',
    imageUrl:'/tiago-gomes/images/tiago-rota-do-dolar-1536.webp',
    imageSrcSet:'/tiago-gomes/images/tiago-rota-do-dolar-576.webp 576w, /tiago-gomes/images/tiago-rota-do-dolar-960.webp 960w, /tiago-gomes/images/tiago-rota-do-dolar-1536.webp 1536w',
  },
  expert:{
    name:'Tiago Gomez', title:'MUITO PRAZER, MEU NOME É TIAGO GOMEZ',
    imageUrl:'/tiago-gomes/images/tiago-momentos-hero-1536.webp',
    imageSrcSet:'/tiago-gomes/images/tiago-momentos-hero-576.webp 576w, /tiago-gomes/images/tiago-momentos-hero-960.webp 960w, /tiago-gomes/images/tiago-momentos-hero-1536.webp 1536w',
    paragraphs:[
      'Quando você cresce vendo a dor de perto, a vida te obriga a escolher rápido: ser a vítima das circunstâncias ou o herói das próximas gerações. Eu escolhi lutar. Sem desculpas e sem negociar com o trabalho duro.',
      'O mercado digital me tirou da comunidade e me colocou no topo. Mas a verdadeira sabedoria veio de errar, consertar, descentralizar e construir um império que opera em diversas frentes no Brasil e lá fora, faturando milhões com inteligência e escala.',
      'Se você está cansado de viver no limite e quer um método testado por quem já esteve no fundo do poço e construiu o próprio império, você está no lugar certo.',
    ], cta:'QUERO ACESSAR O MÉTODO AGORA',
  },
  offer:{
    title:'Copie e Cole a Minha Estrutura Para Gerar de $50 a $250 Dólares Por Dia Com IA Sem Precisar Vender NADA',
    description:'Assista ao vídeo de 3 minutos e veja como replicar essa estratégia simples AINDA HOJE',
    video:{src:'',embedUrl:'',revealAtSeconds:null} as VideoConfig,
    checkoutUrl:'https://pay.kiwify.com.br/14n3TC2', cta:'QUERO GANHAR EM DÓLAR',
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
  {id:'compromisso',label:'Seu acesso',title:'Compromete-se a responder a este questionário rápido com total atenção?',description:'Se pretende desbloquear o PRESENTE SECRETO, o modelo pronto para ativar comissões de $50 dólares, conclua as etapas seguintes.',options:[option('sim','Sim, quero o meu acesso','check'),option('nao','Não tenho interesse','close')]},
  {id:'genero',label:'Sobre você',title:'Você é?',description:'Selecione uma opção para continuar.',options:[option('homem','Homem','user'),option('mulher','Mulher','user')]},
  {id:'idade',label:'Sua idade',title:'Qual sua idade?',description:'Em qual faixa você está?',options:[option('15-25','15 a 25 anos','user'),option('26-35','26 a 35 anos','user'),option('36-45','36 a 45 anos','user'),option('46+','46+ anos','user')]},
  {id:'momento',label:'Sua realidade',title:'Qual dessas frases mais combina com você hoje?',description:'Escolha a mais próxima da sua realidade.',options:[option('clt','Trabalho CLT e quero renda extra','briefcase'),option('sem-renda','Estou desempregado(a) buscando oportunidade','search'),option('autonomo','Sou autônomo(a) querendo aumentar a renda','chart'),option('digital','Estou buscando liberdade no digital','zap')]},
  {id:'experiencia',label:'Suas tentativas',title:'Você já tentou ganhar dinheiro online antes?',description:'Conte qual experiência mais combina com a sua.',options:[option('afiliado','Já tentei ser afiliado no Brasil e não funcionou','repeat'),option('anuncios','Já perdi dinheiro com anúncios','chart'),option('complicado','Já tentei, mas os métodos eram complicados demais','compass'),option('primeira','Nunca tentei, mas tenho medo de aparecer em vídeos','lock')]},
  {id:'motivacao',label:'Sua motivação',title:'O que te MOTIVA a querer ganhar dinheiro online agora?',description:'Pense no que faria diferença na sua vida.',options:[option('dividas','Pagar as dívidas e sair do vermelho','shield'),option('independencia','Conquistar a independência financeira','trophy'),option('sonho','Realizar um sonho específico','sparkles'),option('familia','Ter mais tempo com a família','heart'),option('padrao','Melhorar meu padrão de vida','home')]},
  {id:'sentimento',label:'Como você se sente',title:'Qual dessas frases mais descreve como você se sente hoje?',description:'Escolha a que mais representa seu momento.',options:[option('frustrado','Frustrado(a). Já tentei e não deu','repeat','Mas quero uma chance real'),option('confuso','Confuso(a). Não sei por onde começar','compass','Mas vou aprender o certo'),option('cetico','Cético(a). Parece bom demais','search','Mas quero ver funcionando'),option('inseguro','Animado(a), mas inseguro(a)','shield','Tenho medo de perder dinheiro'),option('urgencia','Desesperado(a). Preciso de resultado agora','clock','Vou fazer o necessário')]},
  {id:'renda',label:'Sua renda atual',title:'Você está satisfeito(a) com sua renda atual?',description:'Como você vê sua situação hoje?',options:[option('mais','Não. Preciso ganhar mais agora','chart','Vou mudar isso em 2026'),option('receio','Não. Tenho medo de arriscar','shield','Mesmo assim vou tentar ser diferente'),option('melhor','Poderia ser melhor','chart','Quero renda extra sem complicação'),option('sem-renda','Não tenho renda hoje','sprout','Vou buscar minha primeira comissão')]},
  {id:'obstaculo',label:'Seu principal obstáculo',title:'O que te IMPEDIU de ganhar dinheiro online até agora?',description:'Selecione o principal obstáculo.',options:[option('direcao','Não sabia por onde começar','compass'),option('anuncios','Perdi dinheiro com anúncios','chart'),option('complexidade','Métodos muito complicados','book'),option('exposicao','Medo de aparecer em vídeos','lock'),option('recursos','Falta de tempo e dinheiro para investir','clock'),option('tentativa','Tentei e não funcionou','repeat')]},
  {id:'sonho',label:'Seu sonho de vida',title:'Qual é o seu sonho de vida que o dinheiro tornaria possível?',description:'Imagine que você está ganhando $300 por dia com meu método.',options:[option('viagem','Viajar o mundo sem preocupação','plane'),option('casa-carro','Comprar a casa ou o carro dos meus sonhos','home'),option('familia','Dar uma vida melhor para quem eu amo','heart'),option('liberdade','Sair do CLT e conquistar mais liberdade','lock'),option('seguranca','Ter tranquilidade e segurança financeira','shield'),option('pessoal','Investir em mim mesmo(a)','sprout')]},
  {id:'meta',label:'Sua meta',title:'Quanto você quer estar GANHANDO por dia daqui a 30 dias?',description:'Seja ambicioso(a), mas realista com seu esforço. A escolha representa seu objetivo, não uma previsão de ganhos.',options:[option('50-300','Entre $50 e $300 por dia','chart'),option('450-700','Entre $450 e $700 por dia','chart'),option('750-1000','Entre $750 e $1.000 por dia','zap'),option('1000-2000','Entre $1.000 e $2.000 por dia','chart'),option('3000+','Acima de $3.000 por dia','trophy')]},
  {id:'tempo',label:'Sua dedicação',title:'Quanto tempo POR DIA você pode dedicar ao método?',description:'Escolha o tempo que consegue reservar na sua rotina.',options:[option('10-30','Entre 10 e 30 minutos','clock'),option('1-2h','Entre 1 e 2 horas','clock'),option('2-3h','Entre 2 e 3 horas','zap'),option('4h+','Mais de 4 horas','zap')]},
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
