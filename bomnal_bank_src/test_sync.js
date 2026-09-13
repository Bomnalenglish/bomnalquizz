// 공유 저장소 합치기 시험.   node test_sync.js
// app_shell.html 안의 합치기 함수를 그대로 떼어 와서 돌린다 (사본을 따로 두지 않는다).
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/app_shell.html', 'utf8');
const code = src.slice(src.indexOf('// 체크는 숫자 배열만'), src.indexOf('let busy = false'));
const {clean, merge} = new Function(code + '\nreturn {clean, merge, mergeOne, mergeTitles};')();

let pass = 0, fail = 0;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function t(name, got, want){
  if(eq(got, want)){ pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name, '\n     got ', JSON.stringify(got), '\n     want', JSON.stringify(want)); }
}
const S  = (st, mk) => clean(st, mk);
const SM = x => ({students: x.students, marks: x.marks});   // 체크만 비교할 때

console.log('■ 처음 붙는 컴퓨터 (기준점 없음) — 아무것도 버리지 않는다');
t('서로 다른 학생은 둘 다 남는다', SM(merge(S(['가'],{가:{A:[1]}}), null, S(['나'],{나:{A:[2]}}))), SM(S(['나','가'],{나:{A:[2]},가:{A:[1]}})));
t('같은 학생 체크는 합쳐진다', SM(merge(S(['가'],{가:{A:[1,2]}}), null, S(['가'],{가:{A:[2,3],B:[9]}}))), SM(S(['가'],{가:{A:[1,2,3],B:[9]}})));

console.log('■ 이미 맞춘 적 있는 컴퓨터 (3자 비교)');
const base = S(['가','나'],{가:{A:[1]},나:{A:[5]}});
t('여기서만 체크 추가 → 올라간다', SM(merge(S(['가','나'],{가:{A:[1,2]},나:{A:[5]}}), base, base)), SM(S(['가','나'],{가:{A:[1,2]},나:{A:[5]}})));
t('저쪽에서만 체크 추가 → 받아온다', SM(merge(base, base, S(['가','나'],{가:{A:[1]},나:{A:[5,6]}}))), SM(S(['가','나'],{가:{A:[1]},나:{A:[5,6]}})));
t('여기서 체크 해제 → 되살아나지 않는다', SM(merge(S(['가','나'],{가:{},나:{A:[5]}}), base, base)), SM(S(['가','나'],{가:{},나:{A:[5]}})));
t('저쪽에서 체크 해제 → 여기도 해제', SM(merge(base, base, S(['가','나'],{가:{A:[1]},나:{}}))), SM(S(['가','나'],{가:{A:[1]},나:{}})));
t('서로 다른 학생을 동시에 → 둘 다 산다', SM(merge(S(['가','나'],{가:{A:[1,2]},나:{A:[5]}}), base, S(['가','나'],{가:{A:[1]},나:{A:[5,6]}}))), SM(S(['가','나'],{가:{A:[1,2]},나:{A:[5,6]}})));
t('같은 학생을 동시에 → 체크를 합친다', SM(merge(S(['가','나'],{가:{A:[1,2]},나:{A:[5]}}), base, S(['가','나'],{가:{A:[1,3]},나:{A:[5]}}))), SM(S(['가','나'],{가:{A:[1,2,3]},나:{A:[5]}})));
t('여기서 학생 추가 → 올라간다', SM(merge(S(['가','나','다'],{가:{A:[1]},나:{A:[5]},다:{B:[7]}}), base, base)), SM(S(['가','나','다'],{가:{A:[1]},나:{A:[5]},다:{B:[7]}})));
t('저쪽에서 학생 추가 → 받아온다', SM(merge(base, base, S(['가','나','라'],{가:{A:[1]},나:{A:[5]},라:{C:[3]}}))), SM(S(['가','나','라'],{가:{A:[1]},나:{A:[5]},라:{C:[3]}})));
t('여기서 학생 삭제 → 되살아나지 않는다', SM(merge(S(['가'],{가:{A:[1]}}), base, base)), SM(S(['가'],{가:{A:[1]}})));
t('저쪽에서 학생 삭제 → 여기서도 지운다', SM(merge(base, base, S(['가'],{가:{A:[1]}}))), SM(S(['가'],{가:{A:[1]}})));
t('저쪽이 지웠는데 여기서 고쳤다 → 살린다', SM(merge(S(['가','나'],{가:{A:[1]},나:{A:[5,9]}}), base, S(['가'],{가:{A:[1]}}))), SM(S(['가','나'],{가:{A:[1]},나:{A:[5,9]}})));

console.log('■ 청소');
t('undefined·문자·빈 배열은 걸러낸다', SM(clean(['가', undefined, ''], {가:{A:[3,'2',undefined,3], B:[]}})), {students:['가'], marks:{가:{A:[2,3]}}});

console.log('■ 자료 이름 (titles)');
const W = (st, mk, ti) => clean(st, mk, ti);
const bT = W(['가'],{가:{}},{A:'모의 1'});
t('여기서 이름 바꿈 → 올라간다', merge(W(['가'],{가:{}},{A:'모의고사 1회'}), bT, bT).titles, {A:'모의고사 1회'});
t('저쪽에서 이름 바꿈 → 받아온다', merge(bT, bT, W(['가'],{가:{}},{A:'새 이름'})).titles, {A:'새 이름'});
t('여기서 원래 이름으로 되돌림 → 지워진다', merge(W(['가'],{가:{}},{}), bT, bT).titles, {});
t('저쪽에서 원래 이름으로 되돌림 → 여기도', merge(bT, bT, W(['가'],{가:{}},{})).titles, {});
t('서로 다른 자료를 동시에 → 둘 다', merge(W(['가'],{가:{}},{A:'모의 1',B:'나'}), bT, W(['가'],{가:{}},{A:'모의 1',C:'다'})).titles, {A:'모의 1',B:'나',C:'다'});
t('같은 자료를 동시에 → 이 컴퓨터 것', merge(W(['가'],{가:{}},{A:'여기'}), bT, W(['가'],{가:{}},{A:'저기'})).titles, {A:'여기'});
t('처음 붙는 컴퓨터 → 합친다', merge(W(['가'],{가:{}},{A:'여기'}), null, W(['가'],{가:{}},{B:'저기'})).titles, {B:'저기',A:'여기'});
t('예전 기준점(titles 없음)도 된다', merge(W(['가'],{가:{}},{A:'새'}), {students:['가'],marks:{가:{}}}, W(['가'],{가:{}},{})).titles, {A:'새'});
t('이름 청소: 겹친 공백·빈칸·숫자', clean([],{},{A:'  두  칸  ',B:'',C:3}).titles, {A:'두 칸'});

console.log(`\n${pass} 통과 · ${fail} 실패`);
process.exit(fail ? 1 : 0);
