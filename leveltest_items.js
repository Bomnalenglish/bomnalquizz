/* ═══════════════════════════════════════════════════════════
   봄날 레벨테스트 · 문항 은행
   - MAIN : 읽기·문법 사다리 (1~11단계)
   - LISTEN : 듣기 사다리 (1~5단계)
   - 어휘는 leveltest_voca.js (봄날보카 단어장에서 뽑은 단어)
   문항 형식
     q    : 질문 (한글)
     show : 화면에 크게 보여 줄 글/지문 (없으면 생략)
     emoji: 그림 대신 쓰는 이모지
     say  : 소리로 들려줄 영어 (단어/문장)
     dlg  : 듣기 대화 [['W','...'],['M','...']]
     ch   : 보기 (첫 번째가 정답이 아니어도 됨 → a 로 정답 위치 지정)
     a    : 정답 위치 (0부터)
     fixed: true 면 보기 순서를 섞지 않음 (①②③ 같은 보기)
     tag  : 영역 (결과지 약점 분석에 사용)
   문항을 더 넣고 싶으면 items 배열에 같은 모양으로 추가하면 됩니다.
═══════════════════════════════════════════════════════════ */

window.LT_TAGS = {
  alpha:     '알파벳 대·소문자와 순서',
  initial:   '단어의 첫소리 (파닉스 기초)',
  cvc:       '단모음 단어 읽기·쓰기 (cat, pig)',
  digraph:   '이중자음·장모음 (sh, ch, ee, a_e)',
  sight:     '기초 단어·짧은 문장 읽기',
  detail:    '글의 세부 내용 파악',
  main:      '글의 주제·요지 파악',
  infer:     '글쓴이·인물의 마음과 의도 추론',
  gram_basic:'기초 문법 (be동사·일반동사·시제)',
  gram_mid:  '중등 문법 (완료·수동태·관계사·to부정사)',
  gram_adv:  '고등 어법',
  blank:     '빈칸 추론',
  order:     '글의 순서·문장 넣기',
  vocab_ctx: '문맥 속 어휘',
  l_word:    '단어 소리 알아듣기',
  l_sent:    '짧은 문장 알아듣기',
  l_detail:  '대화 세부 내용 듣기',
  l_num:     '숫자·시각·금액 듣기',
  l_purpose: '말하는 목적·의견·할 일 파악'
};

window.LT_MAIN = [
  { lv:1, name:'알파벳', short:'알파벳', n:6, pass:5, early:true,
    desc:'알파벳 대·소문자를 구별하고 순서를 알아요',
    items:[
      {q:'B 의 소문자를 고르세요.', show:'B', ch:['b','d','p','q'], a:0, tag:'alpha'},
      {q:'g 의 대문자를 고르세요.', show:'g', ch:['G','Q','J','C'], a:0, tag:'alpha'},
      {q:'빈칸에 들어갈 알파벳은?', show:'A  B  C  _  E', ch:['D','F','G','B'], a:0, tag:'alpha'},
      {q:'빈칸에 들어갈 알파벳은?', show:'M  N  _  P', ch:['O','Q','L','R'], a:0, tag:'alpha'},
      {q:'e 의 대문자를 고르세요.', show:'e', ch:['E','F','B','A'], a:0, tag:'alpha'},
      {q:'u 다음에 오는 알파벳은?', show:'u  →  ?', ch:['v','w','t','x'], a:0, tag:'alpha'},
      {q:'소문자 d 와 짝이 되는 대문자는?', show:'d', ch:['D','B','P','Q'], a:0, tag:'alpha'},
      {q:'빈칸에 들어갈 알파벳은?', show:'w  x  _  z', ch:['y','v','u','j'], a:0, tag:'alpha'}
    ]},
  { lv:2, name:'파닉스 ① 첫소리', short:'첫소리', n:6, pass:5, early:true,
    desc:'단어를 듣고 첫소리 글자를 찾을 수 있어요',
    items:[
      {q:'그림 단어는 어떤 글자로 시작할까요?', emoji:'🐶', say:'dog', ch:['d','b','g','t'], a:0, tag:'initial'},
      {q:'그림 단어는 어떤 글자로 시작할까요?', emoji:'🐟', say:'fish', ch:['f','v','p','h'], a:0, tag:'initial'},
      {q:'그림 단어는 어떤 글자로 시작할까요?', emoji:'🌙', say:'moon', ch:['m','n','w','b'], a:0, tag:'initial'},
      {q:'그림 단어는 어떤 글자로 시작할까요?', emoji:'☀️', say:'sun', ch:['s','z','t','j'], a:0, tag:'initial'},
      {q:'그림 단어는 어떤 글자로 시작할까요?', emoji:'🦁', say:'lion', ch:['l','r','n','i'], a:0, tag:'initial'},
      {q:'그림 단어는 어떤 글자로 시작할까요?', emoji:'🐻', say:'bear', ch:['b','d','p','v'], a:0, tag:'initial'},
      {q:'그림 단어는 어떤 글자로 시작할까요?', emoji:'🥚', say:'egg', ch:['e','a','i','o'], a:0, tag:'initial'},
      {q:'그림 단어는 어떤 글자로 시작할까요?', emoji:'🔑', say:'key', ch:['k','g','t','h'], a:0, tag:'initial'}
    ]},
  { lv:3, name:'파닉스 ② 단모음', short:'단모음', n:6, pass:5, early:true,
    desc:'cat, pig 같은 짧은 모음 단어를 읽고 쓸 수 있어요',
    items:[
      {q:'그림에 맞는 단어를 고르세요.', emoji:'🐱', say:'cat', ch:['cat','cot','cut','cet'], a:0, tag:'cvc'},
      {q:'그림에 맞는 단어를 고르세요.', emoji:'🐷', say:'pig', ch:['pig','peg','pug','pag'], a:0, tag:'cvc'},
      {q:'그림에 맞는 단어를 고르세요.', emoji:'🛏️', say:'bed', ch:['bed','bad','bid','bud'], a:0, tag:'cvc'},
      {q:'그림에 맞는 단어를 고르세요.', emoji:'🦊', say:'fox', ch:['fox','fix','fax','fux'], a:0, tag:'cvc'},
      {q:'그림에 맞는 단어를 고르세요.', emoji:'🎩', say:'hat', ch:['hat','hot','hit','hut'], a:0, tag:'cvc'},
      {q:'단어를 읽고 맞는 그림을 고르세요.', show:'bus', ch:['🚌','🐝','🛁','🧸'], a:0, tag:'cvc', big:true},
      {q:'단어를 읽고 맞는 그림을 고르세요.', show:'cup', ch:['☕','🐶','🎈','🍰'], a:0, tag:'cvc', big:true},
      {q:'단어를 읽고 맞는 그림을 고르세요.', show:'sun', ch:['☀️','🌙','⭐','☁️'], a:0, tag:'cvc', big:true}
    ]},
  { lv:4, name:'파닉스 ③ 이중자음·장모음', short:'이중자음·장모음', n:6, pass:5, early:true,
    desc:'sh, ch, ee, a_e 같은 소리 규칙을 알고 단어를 읽어요',
    items:[
      {q:'그림에 맞는 단어를 고르세요.', emoji:'🚢', say:'ship', ch:['ship','chip','sip','shep'], a:0, tag:'digraph'},
      {q:'그림에 맞는 단어를 고르세요.', emoji:'🧀', say:'cheese', ch:['cheese','sheese','chese','cheeze'], a:0, tag:'digraph'},
      {q:'그림에 맞는 단어를 고르세요.', emoji:'🐑', say:'sheep', ch:['sheep','ship','shep','cheep'], a:0, tag:'digraph'},
      {q:'그림에 맞는 단어를 고르세요.', emoji:'🎂', say:'cake', ch:['cake','cak','keke','caik'], a:0, tag:'digraph'},
      {q:'그림에 맞는 단어를 고르세요.', emoji:'🚂', say:'train', ch:['train','tran','trane','tren'], a:0, tag:'digraph'},
      {q:'그림에 맞는 단어를 고르세요.', emoji:'🐐', say:'goat', ch:['goat','got','gote','gaot'], a:0, tag:'digraph'},
      {q:'그림에 맞는 단어를 고르세요.', emoji:'🐸', say:'frog', ch:['frog','flog','fog','frag'], a:0, tag:'digraph'},
      {q:'단어를 읽고 맞는 그림을 고르세요.', show:'bike', ch:['🚲','🐱','🔑','🍦'], a:0, tag:'digraph', big:true},
      {q:'단어를 읽고 맞는 그림을 고르세요.', show:'tree', ch:['🌳','🏠','🚗','🌸'], a:0, tag:'digraph', big:true}
    ]},
  { lv:5, name:'기초 단어·문장 읽기', short:'문장 읽기', n:6, pass:5, early:true,
    desc:'자주 쓰는 단어와 짧은 문장을 읽고 뜻을 알아요',
    items:[
      {q:'문장의 뜻으로 알맞은 것은?', show:'The cat is on the box.', ch:['고양이가 상자 위에 있다.','고양이가 상자 안에 있다.','개가 상자 위에 있다.','고양이가 침대 위에 있다.'], a:0, tag:'sight'},
      {q:'문장의 뜻으로 알맞은 것은?', show:'I have two red apples.', ch:['나는 빨간 사과 두 개가 있다.','나는 초록 사과 두 개가 있다.','나는 빨간 사과 한 개가 있다.','나는 빨간 공 두 개가 있다.'], a:0, tag:'sight'},
      {q:'문장의 뜻으로 알맞은 것은?', show:'She can swim, but she can’t run fast.', ch:['그녀는 수영은 하지만 빨리 달리지는 못한다.','그녀는 수영도 달리기도 잘한다.','그녀는 수영을 못하지만 빨리 달린다.','그녀는 빨리 걷지 못한다.'], a:0, tag:'sight'},
      {q:'빈칸에 알맞은 말은?', show:'I ___ a student.', ch:['am','is','are','be'], a:0, tag:'gram_basic'},
      {q:'빈칸에 알맞은 말은? (나의)', show:'This is ___ bag.', ch:['my','me','I','mine'], a:0, tag:'gram_basic'},
      {q:'빈칸에 알맞은 말은? (책상 아래에)', show:'Where is my pencil?\nIt is ___ the desk.', ch:['under','in','on','next'], a:0, tag:'sight'},
      {q:'빈칸에 알맞은 말은?', show:'They ___ playing soccer.', ch:['are','is','am','be'], a:0, tag:'gram_basic'},
      {q:'질문에 알맞은 대답은?', show:'What color is the sky?', ch:['It is blue.','I am blue.','Yes, it is.','It is a sky.'], a:0, tag:'sight'}
    ]},
  { lv:6, name:'초등 리딩 ①', short:'초등 리딩①', n:7, pass:5,
    desc:'3~4문장 짧은 글을 읽고 내용을 이해해요 (봄날리딩 1~2권 수준)',
    items:[
      {q:'Max는 무슨 색인가요?', show:'Tom has a dog. Its name is Max. Max is brown and small. Every morning, Tom and Max walk in the park.', ch:['갈색','흰색','검은색','노란색'], a:0, tag:'detail'},
      {q:'Tom과 Max가 아침마다 하는 일은?', show:'Tom has a dog. Its name is Max. Max is brown and small. Every morning, Tom and Max walk in the park.', ch:['공원 산책하기','수영하기','공 차기','학교 가기'], a:0, tag:'detail'},
      {q:'미나가 겨울을 좋아하지 않는 이유는?', show:'Mina likes summer. She can swim in the sea. But she doesn’t like winter because it is too cold.', ch:['너무 추워서','바다가 멀어서','수영을 못해서','눈이 와서'], a:0, tag:'detail'},
      {q:'글쓴이가 어제 본 동물은?', show:'I went to the zoo yesterday. I saw a big elephant. It ate bananas. It was very funny.', ch:['코끼리','원숭이','사자','기린'], a:0, tag:'detail'},
      {q:'빈칸에 알맞은 말은?', show:'He ___ to school every day.', ch:['goes','go','going','gos'], a:0, tag:'gram_basic'},
      {q:'빈칸에 알맞은 말은?', show:'There ___ three books on the table.', ch:['are','is','am','be'], a:0, tag:'gram_basic'},
      {q:'빈칸에 알맞은 말은?', show:'Did she ___ the cake?', ch:['make','makes','made','making'], a:0, tag:'gram_basic'},
      {q:'질문에 알맞은 대답은?', show:'Can you help me?', ch:['Sure, I can.','Yes, I am.','No, you aren’t.','I like it.'], a:0, tag:'sight'},
      {q:'오늘 날씨로 알맞은 것은?', show:'Today is Saturday. It is sunny and warm. Jisu and her brother ride their bikes by the river.', ch:['맑고 따뜻함','비 오고 추움','흐리고 바람','눈이 옴'], a:0, tag:'detail'}
    ]},
  { lv:7, name:'초등 리딩 ②', short:'초등 리딩②', n:7, pass:5,
    desc:'5~6문장 글의 주제와 인물의 마음을 파악해요 (봄날리딩 3~6권 수준)',
    items:[
      {q:'글의 주제로 알맞은 것은?', show:'Every year, people throw away a lot of plastic. Plastic takes hundreds of years to break down. Some of it ends up in the ocean, and sea animals eat it by mistake. We can help by using reusable bags and bottles.', ch:['플라스틱 쓰레기를 줄이자','바다 동물의 종류','플라스틱 만드는 법','장바구니의 역사'], a:0, tag:'main'},
      {q:'글의 내용과 맞지 않는 것은?', show:'Every year, people throw away a lot of plastic. Plastic takes hundreds of years to break down. Some of it ends up in the ocean, and sea animals eat it by mistake. We can help by using reusable bags and bottles.', ch:['플라스틱은 몇 주 만에 분해된다.','바다 동물이 실수로 플라스틱을 먹는다.','다시 쓰는 가방과 병이 도움이 된다.','사람들은 매년 많은 플라스틱을 버린다.'], a:0, tag:'detail'},
      {q:'마지막에 Jake의 기분으로 알맞은 것은?', show:'Jake wanted to buy a new bike, so he saved his money for six months. He walked dogs for his neighbors and washed cars. Finally, he had enough money. He bought the bike all by himself.', ch:['뿌듯하다','지루하다','화가 난다','무섭다'], a:0, tag:'infer'},
      {q:'빈칸에 알맞은 말은?', show:'I am interested ___ science.', ch:['in','on','at','for'], a:0, tag:'gram_basic'},
      {q:'빈칸에 알맞은 말은?', show:'She is taller ___ her brother.', ch:['than','then','that','as'], a:0, tag:'gram_basic'},
      {q:'빈칸에 알맞은 말은?', show:'I want ___ a doctor in the future.', ch:['to be','be','being','am'], a:0, tag:'gram_basic'},
      {q:'빈칸에 알맞은 말은?', show:'When I got home, my mom ___ dinner.', ch:['was cooking','cooks','is cooking','cook'], a:0, tag:'gram_basic'},
      {q:'밑줄 친 cools down 의 뜻은?', show:'The soup is too hot. Wait until it cools down.', ch:['식다','데우다','끓다','마시다'], a:0, tag:'vocab_ctx'}
    ]},
  { lv:8, name:'중등 기초', short:'중등 기초', n:8, pass:6,
    desc:'중1~2 문법과 짧은 설명문 독해 (봄날리딩 7~8권·튜터 수준)',
    items:[
      {q:'빈칸에 알맞은 말은?', show:'I have ___ to Jeju Island twice.', ch:['been','gone','went','go'], a:0, tag:'gram_mid'},
      {q:'빈칸에 알맞은 말은?', show:'This book was written ___ a famous writer.', ch:['by','with','from','of'], a:0, tag:'gram_mid'},
      {q:'빈칸에 알맞은 말은?', show:'I know the girl ___ is singing on the stage.', ch:['who','which','whose','what'], a:0, tag:'gram_mid'},
      {q:'빈칸에 알맞은 말은?', show:'If it ___ tomorrow, we will stay home.', ch:['rains','will rain','rained','rain'], a:0, tag:'gram_mid'},
      {q:'빈칸에 알맞은 말은?', show:'Playing games too much ___ bad for your eyes.', ch:['is','are','be','were'], a:0, tag:'gram_mid'},
      {q:'빈칸에 알맞은 말은?', show:'He asked me ___ the window.', ch:['to open','open','opening','opened'], a:0, tag:'gram_mid'},
      {q:'글의 요지로 알맞은 것은?', show:'Many teenagers stay up late using their phones. However, sleep is very important for growing bodies. Without enough sleep, students find it hard to focus in class. Experts suggest putting phones away one hour before bed.', ch:['자기 전 휴대폰을 멀리하고 충분히 자야 한다.','휴대폰은 공부에 도움이 된다.','청소년은 키가 빨리 자란다.','수업 시간을 줄여야 한다.'], a:0, tag:'main'},
      {q:'전문가들이 제안하는 것은?', show:'Many teenagers stay up late using their phones. However, sleep is very important for growing bodies. Without enough sleep, students find it hard to focus in class. Experts suggest putting phones away one hour before bed.', ch:['잠자기 한 시간 전에 휴대폰 치우기','아침에 운동하기','수업 시간에 휴대폰 쓰기','낮잠 자기'], a:0, tag:'detail'},
      {q:'빈칸에 알맞은 말은?', show:'It is important ___ breakfast every day.', ch:['to eat','eat','eats','ate'], a:0, tag:'gram_mid'},
      {q:'말하는 사람의 의도는?', show:'Excuse me. Could you tell me how to get to the library?', ch:['길 묻기','사과하기','초대하기','칭찬하기'], a:0, tag:'infer'}
    ]},
  { lv:9, name:'중등 심화', short:'중등 심화', n:8, pass:6,
    desc:'중2~3 어법과 주제·빈칸·순서 문제 (예비 고1 수준)',
    items:[
      {q:'빈칸에 알맞은 말은?', show:'This is the house ___ I was born.', ch:['where','which','what','who'], a:0, tag:'gram_mid'},
      {q:'빈칸에 알맞은 말은?', show:'I wish I ___ a bird.', ch:['were','am','be','will be'], a:0, tag:'gram_mid'},
      {q:'빈칸에 알맞은 말은?', show:'The movie was so ___ that I fell asleep.', ch:['boring','bored','bore','bores'], a:0, tag:'gram_mid'},
      {q:'빈칸에 알맞은 말은?', show:'Not only Tom but also his friends ___ coming.', ch:['are','is','was','be'], a:0, tag:'gram_mid'},
      {q:'어법상 올바른 문장은?', ch:['She made me clean my room.','She made me to clean my room.','She made me cleaning my room.','She made me cleaned my room.'], a:0, tag:'gram_mid'},
      {q:'글의 주제로 알맞은 것은?', show:'Many people are afraid of making mistakes. They think mistakes show that they are not smart. However, researchers have found that our brains grow when we struggle with difficult problems. Each mistake tells us what we need to fix. So, instead of hiding your mistakes, look at them closely and learn from them.', ch:['실수를 통해 배우는 것의 가치','똑똑한 사람의 특징','뇌의 구조','시험을 잘 보는 법'], a:0, tag:'main'},
      {q:'빈칸에 알맞은 말은?', show:'Animals have different ways to protect themselves. A turtle hides in its hard shell. A chameleon changes its color to match its surroundings. In other words, each animal has its own way to ________.', ch:['stay safe','find food','make friends','travel far'], a:0, tag:'blank'},
      {q:'글의 순서로 알맞은 것은?', show:'Minsu wanted to bake cookies for his mom.\n(A) Then he mixed flour, sugar, and eggs.\n(B) First, he went to the store to buy flour.\n(C) Finally, he put the cookies in the oven.', ch:['(B) - (A) - (C)','(A) - (B) - (C)','(C) - (A) - (B)','(B) - (C) - (A)'], a:0, fixed:true, tag:'order'},
      {q:'다음 문장과 뜻이 같은 것은?', show:'Having finished his homework, he went out.', ch:['After he had finished his homework, he went out.','Because he finishes his homework, he goes out.','Although he finished his homework, he stayed home.','If he finishes his homework, he will go out.'], a:0, tag:'gram_mid'}
    ]},
  { lv:10, name:'고1 모의고사 수준', short:'고1 모의', n:6, pass:4,
    desc:'고1 모의고사 유형 — 주제·요지·빈칸·어법·순서',
    items:[
      {q:'글의 주제로 가장 알맞은 것은?', show:'We often try to avoid boredom by checking our phones whenever we have a free moment. Yet psychologists suggest that boredom may serve an important purpose. When the mind has nothing to focus on, it begins to wander, making unexpected connections between ideas. In one study, participants who first completed a dull task came up with more creative uses for everyday objects than those who did not. Rather than filling every empty moment, then, we might benefit from allowing ourselves to be bored.', ch:['the role of boredom in encouraging creative thinking','ways to avoid boredom with technology','the negative effects of smartphones on sleep','why dull tasks reduce productivity'], a:0, tag:'main'},
      {q:'밑줄 친 부분 중 어법상 틀린 것은?', show:'The number of students who walk to school ①have decreased ②since the new bus line ③was introduced, ④which surprised many parents.', ch:['① have','② since','③ was introduced','④ which'], a:0, fixed:true, tag:'gram_adv'},
      {q:'빈칸에 들어갈 말로 가장 알맞은 것은?', show:'Good leaders do not simply give orders. They listen carefully to their team members, ask for their opinions, and admit when they are wrong. By doing so, they create an environment in which people feel safe to share new ideas. In short, effective leadership depends less on control than on ________.', ch:['trust','power','rules','speed'], a:0, tag:'blank'},
      {q:'글의 요지로 가장 알맞은 것은?', show:'Many people believe that talent is what leads to success. However, studies of top performers show that what really matters is deliberate practice — focused effort to improve specific weaknesses, often with feedback from a coach. Simply repeating what you already do well does not make you better.', ch:['약점을 고치려는 의도적인 연습이 성공의 핵심이다.','타고난 재능이 성공을 결정한다.','코치 없이 혼자 연습하는 것이 좋다.','잘하는 것만 반복해야 실력이 는다.'], a:0, tag:'main'},
      {q:'주어진 글 다음에 이어질 글의 순서로 알맞은 것은?', show:'Plants cannot run away from danger, but they are not defenseless.\n(A) For example, some plants, like roses, grow sharp thorns that keep animals away.\n(B) Even more surprisingly, when attacked, certain plants release a scent that attracts insects which eat their attackers.\n(C) Others produce chemicals that make their leaves taste bitter, so animals stop eating them.', ch:['(A) - (C) - (B)','(B) - (A) - (C)','(C) - (A) - (B)','(A) - (B) - (C)'], a:0, fixed:true, tag:'order'},
      {q:'빈칸에 들어갈 낱말로 가장 알맞은 것은?', show:'Because the instructions were ________, many users got confused and called customer service.', ch:['ambiguous','obvious','precise','helpful'], a:0, tag:'vocab_ctx'},
      {q:'빈칸에 들어갈 말로 가장 알맞은 것은?', show:'Most of us think we decide what to buy based on price and quality. But stores know better. They play slow music to make us walk more slowly, and they place everyday items like milk at the back so we pass many other products on the way. In this way, our shopping choices are often shaped by ________.', ch:['the design of the store','our careful planning','the advice of friends','the quality of products'], a:0, tag:'blank'}
    ]},
  { lv:11, name:'고2~3 수능 수준', short:'수능형', n:6, pass:4,
    desc:'고2~3·수능 유형 — 추상적 빈칸·어법·문장 넣기',
    items:[
      {q:'빈칸에 들어갈 말로 가장 알맞은 것은?', show:'Memory is not a recording device that stores events exactly as they happened. Each time we recall an experience, we reconstruct it, filling in gaps with what we expect or what we have learned since. This is why two witnesses to the same event can confidently give different accounts. Our memories, in this sense, are less a record of the past than ________.', ch:['a reflection of our present beliefs','a perfect copy of reality','a product of careful observation','a source of scientific evidence'], a:0, tag:'blank'},
      {q:'밑줄 친 부분 중 어법상 틀린 것은?', show:'The scientist, ①whose research was ignored for decades, finally received recognition ②when her theory ③proved correct, ④leading to a breakthrough that ⑤have changed the field.', ch:['① whose','② when','③ proved','④ leading','⑤ have changed'], a:4, fixed:true, tag:'gram_adv'},
      {q:'주어진 문장이 들어가기에 가장 알맞은 곳은?', show:'[주어진 문장] This, however, is only half the story.\n\nFor a long time, economists assumed that people make decisions rationally, carefully weighing costs and benefits. ( ① ) This assumption made it possible to build elegant mathematical models. ( ② ) Behavioral economists have shown that our choices are strongly shaped by emotions, habits, and the way options are presented. ( ③ ) For instance, people are more likely to choose a product labeled ‘90% fat-free’ than one labeled ‘10% fat.’ ( ④ )', ch:['①','②','③','④'], a:1, fixed:true, tag:'order'},
      {q:'글의 제목으로 가장 알맞은 것은?', show:'In an age of information overload, the ability to ignore is becoming as valuable as the ability to pay attention. Those who succeed are not necessarily those who know the most, but those who can decide what is not worth knowing. Filtering, rather than collecting, has become the critical skill.', ch:['The Art of Knowing What to Ignore','Why We Need More Information','Attention Spans Are Growing Longer','Collecting Knowledge Is the Key to Success'], a:0, tag:'main'},
      {q:'빈칸에 들어갈 말로 가장 알맞은 것은?', show:'Many cities have built more roads to reduce traffic. ________, new roads often attract more drivers, and traffic soon returns to its previous level.', ch:['Ironically','Similarly','For example','In addition'], a:0, tag:'blank'},
      {q:'빈칸에 들어갈 낱말로 가장 알맞은 것은?', show:'Despite years of failure, she remained ________, convinced that her approach would eventually succeed.', ch:['persistent','indifferent','reluctant','hostile'], a:0, tag:'vocab_ctx'},
      {q:'빈칸에 들어갈 말로 가장 알맞은 것은?', show:'We tend to believe that more choice always makes us happier. Yet when people are offered dozens of options, they often delay their decision or feel less satisfied with what they finally choose, wondering whether another option would have been better. Beyond a certain point, abundance of choice ________.', ch:['becomes a burden rather than a benefit','guarantees better decisions','reduces the price of products','makes people more confident'], a:0, tag:'blank'}
    ]}
];

window.LT_LISTEN = [
  { lv:1, name:'단어 듣기', short:'단어', n:4, pass:3,
    desc:'단어를 듣고 알맞은 그림을 찾아요',
    items:[
      {q:'잘 듣고 알맞은 그림을 고르세요.', say:'rabbit', ch:['🐰','🐶','🐱','🐭'], a:0, tag:'l_word', big:true},
      {q:'잘 듣고 알맞은 그림을 고르세요.', say:'umbrella', ch:['☂️','🍎','🚗','🏠'], a:0, tag:'l_word', big:true},
      {q:'잘 듣고 알맞은 그림을 고르세요.', say:'door', ch:['🚪','🛏️','🚗','📺'], a:0, tag:'l_word', big:true},
      {q:'잘 듣고 알맞은 그림을 고르세요.', say:'grapes', ch:['🍇','🍌','🍓','🍊'], a:0, tag:'l_word', big:true},
      {q:'잘 듣고 알맞은 그림을 고르세요.', say:'pencil', ch:['✏️','📚','🎒','✂️'], a:0, tag:'l_word', big:true}
    ]},
  { lv:2, name:'문장 듣기', short:'문장', n:4, pass:3,
    desc:'짧은 문장을 듣고 뜻을 알아들어요 (초등 3~4학년 듣기)',
    items:[
      {q:'잘 듣고 알맞은 것을 고르세요.', say:'The boy is riding a bike.', ch:['소년이 자전거를 탄다.','소녀가 자전거를 탄다.','소년이 공을 찬다.','소년이 버스를 탄다.'], a:0, tag:'l_sent'},
      {q:'어디가 아프다고 했나요?', say:'I have a headache.', ch:['머리','배','이','다리'], a:0, tag:'l_sent'},
      {q:'오늘 날씨는?', say:'It is rainy and cold today.', ch:['비 오고 추움','맑고 더움','눈이 옴','바람이 붊'], a:0, tag:'l_sent'},
      {q:'생일은 몇 월인가요?', say:'My birthday is in May.', ch:['5월','3월','8월','10월'], a:0, tag:'l_num'},
      {q:'잘 듣고 알맞은 것을 고르세요.', say:'There are four cats under the tree.', ch:['나무 아래 고양이 네 마리','나무 위 고양이 네 마리','나무 아래 강아지 네 마리','나무 아래 고양이 두 마리'], a:0, tag:'l_sent'}
    ]},
  { lv:3, name:'초등 대화 듣기', short:'초등 대화', n:4, pass:3,
    desc:'짧은 대화를 듣고 내용을 파악해요 (초등 5~6학년 듣기평가)',
    items:[
      {q:'남자가 사려는 것은?', dlg:[['W','Can I help you?'],['M','Yes, I’m looking for a blue cap.'],['W','How about this one?'],['M','Great. I’ll take it.']], ch:['파란 모자','빨간 모자','파란 가방','운동화'], a:0, tag:'l_detail'},
      {q:'지금 몇 시인가요?', dlg:[['M','What time is it now?'],['W','It’s ten to four.'],['M','Oh no, I’m late for my piano lesson!']], ch:['3시 50분','4시 10분','10시 4분','4시'], a:0, tag:'l_num'},
      {q:'남자가 주말에 한 일은?', dlg:[['W','What did you do last weekend?'],['M','I went fishing with my dad.'],['W','Did you catch any fish?'],['M','Yes, I caught three!']], ch:['아빠와 낚시','엄마와 등산','친구와 수영','혼자 독서'], a:0, tag:'l_detail'},
      {q:'은행은 어디에 있나요?', dlg:[['M','Excuse me. Where is the bank?'],['W','Go straight and turn left. It’s next to the bakery.'],['M','Thank you!']], ch:['빵집 옆','병원 옆','학교 앞','우체국 뒤'], a:0, tag:'l_detail'},
      {q:'부산의 날씨는?', dlg:[['W','How’s the weather in Busan?'],['M','It’s sunny but very windy.']], ch:['맑고 바람이 많이 붊','흐리고 비','눈이 옴','덥고 습함'], a:0, tag:'l_detail'}
    ]},
  { lv:4, name:'중등 듣기평가', short:'중등 듣기', n:4, pass:3,
    desc:'중학교 영어듣기평가 수준의 대화를 이해해요',
    items:[
      {q:'남자가 피곤한 이유는?', dlg:[['W','Hi, Jason. You look tired.'],['M','I stayed up late finishing my science report.'],['W','Is it due today?'],['M','Yes, I have to hand it in by lunch.']], ch:['과학 보고서를 하느라 늦게 자서','게임을 늦게까지 해서','아침에 운동을 해서','감기에 걸려서'], a:0, tag:'l_detail'},
      {q:'남자가 지불할 금액은?', dlg:[['M','Excuse me, how much are the tickets?'],['W','Adult tickets are twelve dollars, and children’s tickets are eight dollars.'],['M','Two adult tickets and one child ticket, please.']], ch:['$32','$28','$36','$24'], a:0, tag:'l_num'},
      {q:'남자가 축제에 못 가는 이유는?', dlg:[['W','Mike, are you coming to the school festival on Friday?'],['M','I’d love to, but I have to visit my grandmother in the hospital.'],['W','Oh, I hope she gets better soon.']], ch:['할머니 병문안','시험 공부','가족 여행','학원 수업'], a:0, tag:'l_detail'},
      {q:'남자가 먼저 해야 할 일은?', dlg:[['M','Mom, can I go to the park with Tom?'],['W','Did you clean your room?'],['M','Not yet.'],['W','Then clean your room first. You can go after that.']], ch:['방 청소','숙제','설거지','공원 가기'], a:0, tag:'l_purpose'},
      {q:'두 사람이 만날 시각은?', dlg:[['W','Where should we meet tomorrow?'],['M','How about in front of the library at two?'],['W','Can we make it three? I have a dance class until two thirty.'],['M','Sure, no problem.']], ch:['3시','2시','2시 30분','4시'], a:0, tag:'l_num'}
    ]},
  { lv:5, name:'고등 듣기평가', short:'고등 듣기', n:4, pass:3,
    desc:'고등 영어듣기평가·수능 수준 — 목적·의견·금액',
    items:[
      {q:'방송의 목적으로 알맞은 것은?', dlg:[['M','Hello, students. This is your principal speaking. As you know, our school’s annual charity run was going to be held this Saturday. However, because heavy rain is expected, we have decided to postpone the event to the following Saturday. Students who have already registered do not need to sign up again. Thank you for your understanding.']], ch:['자선 달리기 일정 연기 안내','참가 신청 마감 안내','우천 시 안전 수칙 안내','참가비 납부 안내'], a:0, tag:'l_purpose'},
      {q:'여자가 지불할 금액은?', dlg:[['W','Honey, I’m thinking of buying a desk lamp for Jimin.'],['M','Good idea. What about this one? It’s forty dollars.'],['W','Hmm, I’d prefer one with a USB port. This one has it, and it’s fifty dollars.'],['M','Okay. And we have a ten percent discount coupon.'],['W','Great. Let’s use it.']], ch:['$45','$50','$40','$36'], a:0, tag:'l_num'},
      {q:'여자가 남자에게 제안한 것은?', dlg:[['M','Ms. Kim, I’m worried about my presentation tomorrow.'],['W','What’s the problem?'],['M','I have too much information, and I can’t finish within ten minutes.'],['W','Why don’t you focus on just three key points and put the details in a handout?'],['M','That’s a good idea. Thank you.']], ch:['핵심 세 가지에 집중하고 자세한 내용은 유인물로','발표 시간을 늘려 달라고 하기','발표를 다른 날로 미루기','슬라이드를 더 많이 만들기'], a:0, tag:'l_purpose'},
      {q:'남자의 의견으로 알맞은 것은?', dlg:[['W','Did you hear that the city is going to close the old public pool?'],['M','Yes, but I think it’s a mistake. Many elderly people exercise there every morning.'],['W','But the building is really old, and repairs would cost a lot.'],['M','Still, the city should find a way to keep it. It’s important for people’s health.']], ch:['주민 건강을 위해 수영장을 지켜야 한다.','낡은 수영장은 철거해야 한다.','수영장 이용료를 올려야 한다.','새 수영장을 다른 곳에 지어야 한다.'], a:0, tag:'l_purpose'},
      {q:'남자가 하기로 한 것은?', dlg:[['M','Excuse me. I bought this jacket here yesterday, but it’s too small.'],['W','Would you like a refund or an exchange?'],['M','I’d like to exchange it for a larger size.'],['W','I’m sorry, but we don’t have a larger size in this color.'],['M','Then I’ll take the black one in large.']], ch:['검은색 큰 사이즈로 교환','환불 받기','다른 매장 방문','같은 색으로 주문하기'], a:0, tag:'l_purpose'}
    ]}
];
