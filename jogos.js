(() => {
'use strict';
const R = {};
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const SUITS = ['♣', '♥', '♠', '♦'];
const RED = s => s === '♥' || s === '♦';
R.xadrez = (() => {
const START = 'rnbqkbnrpppppppp' + '.'.repeat(32) + 'PPPPPPPPRNBQKBNR';
const isW = p => p !== '.' && p === p.toUpperCase();
const col = p => p === '.' ? null : isW(p) ? 'w' : 'b';
const on = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
function attacked(b, sq, by) {
const r = sq >> 3, c = sq & 7;
const pd = by === 'w' ? 1 : -1;
for (const dc of [-1, 1]) { const rr = r + pd, cc = c + dc; if (on(rr, cc) && b[rr * 8 + cc] === (by === 'w' ? 'P' : 'p')) return true; }
for (const [dr, dc] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) { const rr = r + dr, cc = c + dc; if (on(rr, cc) && b[rr * 8 + cc] === (by === 'w' ? 'N' : 'n')) return true; }
for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (on(rr, cc) && b[rr * 8 + cc] === (by === 'w' ? 'K' : 'k')) return true; }
const slide = (dirs, set) => { for (const [dr, dc] of dirs) { let rr = r + dr, cc = c + dc; while (on(rr, cc)) { const p = b[rr * 8 + cc]; if (p !== '.') { if (col(p) === by && set.includes(p.toLowerCase())) return true; break; } rr += dr; cc += dc; } } return false; };
return slide([[1, 0], [-1, 0], [0, 1], [0, -1]], 'rq') || slide([[1, 1], [1, -1], [-1, 1], [-1, -1]], 'bq');
}
function pseudo(s, side) {
const b = s.b, out = [];
for (let sq = 0; sq < 64; sq++) {
const p = b[sq]; if (col(p) !== side) continue;
const r = sq >> 3, c = sq & 7, t = p.toLowerCase();
const add = (to, extra) => out.push(Object.assign({f: sq, t: to}, extra || {}));
if (t === 'p') {
const d = side === 'w' ? -1 : 1, r1 = r + d, startR = side === 'w' ? 6 : 1, lastR = side === 'w' ? 0 : 7;
if (on(r1, c) && b[r1 * 8 + c] === '.') {
if (r1 === lastR) add(r1 * 8 + c, {pr: 1}); else add(r1 * 8 + c);
if (r === startR && b[(r + 2 * d) * 8 + c] === '.') add((r + 2 * d) * 8 + c, {dbl: 1});
}
for (const dc of [-1, 1]) {
const cc = c + dc; if (!on(r1, cc)) continue; const to = r1 * 8 + cc;
if (b[to] !== '.' && col(b[to]) !== side) add(to, r1 === lastR ? {pr: 1} : null);
else if (to === s.ep) add(to, {ep: 1});
}
} else if (t === 'n' || t === 'k') {
const ds = t === 'n' ? [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
for (const [dr, dc] of ds) { const rr = r + dr, cc = c + dc; if (on(rr, cc) && col(b[rr * 8 + cc]) !== side) add(rr * 8 + cc); }
if (t === 'k') {
const opp = side === 'w' ? 'b' : 'w', row = side === 'w' ? 7 : 0;
if (sq === row * 8 + 4 && !attacked(b, sq, opp)) {
if (s.cr.includes(side === 'w' ? 'K' : 'k') && b[row * 8 + 5] === '.' && b[row * 8 + 6] === '.' && !attacked(b, row * 8 + 5, opp) && !attacked(b, row * 8 + 6, opp)) add(row * 8 + 6, {cs: 'k'});
if (s.cr.includes(side === 'w' ? 'Q' : 'q') && b[row * 8 + 3] === '.' && b[row * 8 + 2] === '.' && b[row * 8 + 1] === '.' && !attacked(b, row * 8 + 3, opp) && !attacked(b, row * 8 + 2, opp)) add(row * 8 + 2, {cs: 'q'});
}
}
} else {
const ds = t === 'r' ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : t === 'b' ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
for (const [dr, dc] of ds) { let rr = r + dr, cc = c + dc; while (on(rr, cc)) { const q = b[rr * 8 + cc]; if (q === '.') add(rr * 8 + cc); else { if (col(q) !== side) add(rr * 8 + cc); break; } rr += dr; cc += dc; } }
}
}
return out;
}
function apply(s, m, promo) {
const b = s.b.split(''), p = b[m.f], side = col(p);
b[m.t] = p; b[m.f] = '.';
if (m.ep) b[m.t + (side === 'w' ? 8 : -8)] = '.';
if (m.pr) b[m.t] = side === 'w' ? (promo || 'Q').toUpperCase() : (promo || 'q').toLowerCase();
if (m.cs) { const row = side === 'w' ? 7 : 0; if (m.cs === 'k') { b[row * 8 + 5] = b[row * 8 + 7]; b[row * 8 + 7] = '.'; } else { b[row * 8 + 3] = b[row * 8]; b[row * 8] = '.'; } }
let cr = s.cr;
const strip = ch => { cr = cr.replace(ch, ''); };
if (p === 'K') { strip('K'); strip('Q'); } if (p === 'k') { strip('k'); strip('q'); }
[[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']].forEach(([q, ch]) => { if (m.f === q || m.t === q) strip(ch); });
return {b: b.join(''), turn: side === 'w' ? 'b' : 'w', cr, ep: m.dbl ? (m.f + m.t) / 2 : -1};
}
const kingSq = (b, side) => b.indexOf(side === 'w' ? 'K' : 'k');
function legal(s) {
return pseudo(s, s.turn).filter(m => { const n = apply(s, m); return !attacked(n.b, kingSq(n.b, s.turn), n.turn); });
}
function status(s) {
const lg = legal(s), chk = attacked(s.b, kingSq(s.b, s.turn), s.turn === 'w' ? 'b' : 'w');
if (!lg.length) return chk ? 'mate' : 'afogado';
const pcs = s.b.replace(/[.kK]/g, '');
if (!pcs || pcs === 'n' || pcs === 'N' || pcs === 'b' || pcs === 'B') return 'material';
return chk ? 'xeque' : '';
}
return {
name: 'Xadrez', min: 2, max: 2, icon: '♞',
init: seats => ({b: START, turn: 'w', cr: 'KQkq', ep: -1, last: null, moves: [], over: null, cap: {w: '', b: ''}, st: ''}),
view: (s) => s,
turnSeat: s => s.over ? -1 : (s.turn === 'w' ? 0 : 1),
act(s, seat, a) {
if (a.op === 'resign') { if (s.over) return 'Partida já acabou.'; s.over = {win: 1 - seat, why: 'desistência'}; return; }
if (s.over) return 'Partida já acabou.';
if (a.op !== 'move') return 'Ação inválida.';
if ((s.turn === 'w' ? 0 : 1) !== seat) return 'Não é sua vez.';
const m = legal(s).find(x => x.f === a.f && x.t === a.t);
if (!m) return 'Movimento ilegal.';
const capd = s.b[m.t] !== '.' ? s.b[m.t] : m.ep ? (s.turn === 'w' ? 'p' : 'P') : '';
const n = apply(s, m, a.pr && 'qrbn'.includes(a.pr.toLowerCase()) ? a.pr : 'q');
Object.assign(s, n); s.last = [m.f, m.t];
if (capd) s.cap[isW(capd) ? 'b' : 'w'] += capd;
s.moves.push(a.f + '-' + a.t);
s.st = status(s);
if (s.st === 'mate') s.over = {win: seat, why: 'xeque-mate'};
else if (s.st === 'afogado' || s.st === 'material') s.over = {win: -1, why: s.st === 'afogado' ? 'afogamento' : 'material insuficiente'};
},
legal, col, isW
};
})();
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const deck52 = (n = 1) => { const d = []; for (let k = 0; k < n; k++) for (const s of SUITS) for (const r of RANKS) d.push(r + s); return shuffle(d); };
const cRank = c => c.slice(0, -1), cSuit = c => c.slice(-1);
R.vinteum = (() => {
const val = h => { let t = 0, a = 0; for (const c of h) { const r = cRank(c); if (r === 'A') { a++; t += 11; } else t += ['J', 'Q', 'K'].includes(r) ? 10 : +r; } while (t > 21 && a) { t -= 10; a--; } return t; };
function deal(s) {
if (s.deck.length < 20) s.deck = deck52(4);
s.dealer = [s.deck.pop(), s.deck.pop()];
s.hands = s.chips.map((ch, i) => s.seatOn[i] && ch >= s.bet ? [s.deck.pop(), s.deck.pop()] : null);
s.done = s.hands.map(h => !h); s.res = s.hands.map(() => ''); s.phase = 'play'; s.round++;
s.hands.forEach((h, i) => { if (h && val(h) === 21) s.done[i] = true; });
s.cur = s.done.findIndex(d => !d);
if (s.cur < 0) finish(s);
}
function finish(s) {
s.phase = 'end';
const allBust = s.hands.every((h, i) => !h || val(h) > 21);
if (!allBust) while (val(s.dealer) < 17) s.dealer.push(s.deck.pop());
const dv = val(s.dealer), dbj = dv === 21 && s.dealer.length === 2;
s.hands.forEach((h, i) => {
if (!h) return; const v = val(h), bj = v === 21 && h.length === 2;
let d = 0, r;
if (v > 21) { d = -s.bet; r = 'Estourou'; }
else if (bj && !dbj) { d = Math.round(s.bet * 1.5); r = 'Blackjack!'; }
else if (dv > 21 || v > dv) { d = s.bet; r = 'Ganhou'; }
else if (v === dv) { r = 'Empate'; }
else { d = -s.bet; r = 'Perdeu'; }
s.chips[i] += d; s.res[i] = r + (d ? ` (${d > 0 ? '+' : ''}${d})` : '');
});
}
function next(s) { s.cur = s.done.findIndex(d => !d); if (s.cur < 0) finish(s); }
return {
name: '21', min: 1, max: 5, icon: '🂡',
init: seats => ({deck: deck52(4), dealer: [], hands: [], chips: seats.map(() => 100), seatOn: seats.map(x => !!x), bet: 10, phase: 'bet', cur: -1, done: [], res: [], round: 0}),
view(s, seat) { const v = JSON.parse(JSON.stringify(s)); delete v.deck; if (s.phase === 'play') v.dealer = [s.dealer[0], '??']; v.vals = s.hands.map(h => h ? val(h) : 0); v.dval = s.phase === 'play' ? val([s.dealer[0]]) : val(s.dealer); return v; },
turnSeat: s => s.phase === 'play' ? s.cur : -1,
seatsChanged(s, seats) { s.seatOn = seats.map(x => !!x); while (s.chips.length < seats.length) s.chips.push(100); },
act(s, seat, a) {
if (a.op === 'deal') { if (s.phase === 'play') return 'Rodada em andamento.'; s.seatOn = s.seatOn; deal(s); return; }
if (a.op === 'bet') { if (s.phase === 'play') return 'Espere a rodada acabar.'; s.bet = Math.max(1, Math.min(100, a.v | 0)); return; }
if (s.phase !== 'play' || s.cur !== seat) return 'Não é sua vez.';
const h = s.hands[seat];
if (a.op === 'hit') { h.push(s.deck.pop()); if (val(h) >= 21) { s.done[seat] = true; next(s); } return; }
if (a.op === 'stand') { s.done[seat] = true; next(s); return; }
if (a.op === 'double') { if (h.length !== 2 || s.chips[seat] < s.bet * 2) return 'Não dá para dobrar.'; h.push(s.deck.pop()); s.hands[seat].dbl = 1; s.done[seat] = true; next(s); return; }
return 'Ação inválida.';
},
val
};
})();
R.trinca = (() => {
const RV = r => RANKS.indexOf(r) + 1;
function validGroup(g) {
if (g.length < 3) return false;
const rs = g.map(cRank), ss = g.map(cSuit);
if (rs.every(r => r === rs[0])) return new Set(ss).size === ss.length; // trinca: naipes diferentes
if (!ss.every(x => x === ss[0])) return false;
const v = rs.map(RV).sort((a, b) => a - b);
const seq = arr => arr.every((x, i) => !i || x === arr[i - 1] + 1);
if (seq(v)) return true;
if (v[0] === 1) { const hi = v.slice(1).concat(14); return seq(hi); }
return false;
}
function partition(cards) {
if (!cards.length) return [];
const [first, ...rest] = cards;
const n = rest.length;
for (let size = 2; size <= n; size++) {
const idx = [];
const rec = (start) => {
if (idx.length === size) {
const g = [first, ...idx.map(i => rest[i])];
if (!validGroup(g)) return null;
const others = rest.filter((_, i) => !idx.includes(i));
const p = partition(others);
return p ? [g, ...p] : null;
}
for (let i = start; i < n; i++) { idx.push(i); const r = rec(i + 1); if (r) return r; idx.pop(); }
return null;
};
const r = rec(0); if (r) return r;
}
return null;
}
return {
name: 'Trinca', min: 2, max: 4, icon: '🃏',
init(seats) {
const deck = deck52(2), hands = seats.map(x => x ? deck.splice(0, 9) : null);
return {deck, hands, disc: [deck.pop()], cur: seats.findIndex(x => x), drew: false, over: null, last: ''};
},
view(s, seat) { const v = {...s}; v.deckN = s.deck.length; delete v.deck; v.hands = s.hands.map((h, i) => h ? (i === seat || seat === -2 || s.over ? h : h.length) : null); v.top = s.disc[s.disc.length - 1] || null; v.disc = undefined; return v; },
turnSeat: s => s.over ? -1 : s.cur,
act(s, seat, a) {
if (s.over) return 'Partida acabou.';
if (seat !== s.cur) return 'Não é sua vez.';
const h = s.hands[seat];
if (a.op === 'sort') { h.splice(0, h.length, ...a.order.filter(c => h.includes(c))); return; }
if (a.op === 'draw') {
if (s.drew) return 'Você já comprou.';
if (a.from === 'disc') { if (!s.disc.length) return 'Lixo vazio.'; h.push(s.disc.pop()); s.last = 'pegou do lixo'; }
else { if (!s.deck.length) { const top = s.disc.pop(); s.deck = shuffle(s.disc); s.disc = [top]; } h.push(s.deck.pop()); s.last = 'comprou do monte'; }
s.drew = true; return;
}
if (a.op === 'discard' || a.op === 'bater') {
if (!s.drew) return 'Compre uma carta primeiro.';
const i = h.indexOf(a.c); if (i < 0) return 'Carta não está na mão.';
if (a.op === 'bater') {
const rest = h.filter((_, k) => k !== i), p = partition(rest);
if (!p) return 'Ainda não fecha: precisa de 3 jogos (trincas ou sequências do mesmo naipe).';
h.splice(i, 1); s.disc.push(a.c); s.over = {win: seat, groups: p}; return;
}
h.splice(i, 1); s.disc.push(a.c); s.drew = false;
let n = seat; do { n = (n + 1) % s.hands.length; } while (!s.hands[n]);
s.cur = n; s.last = 'descartou ' + a.c; return;
}
return 'Ação inválida.';
},
validGroup, partition
};
})();
R.truco = (() => {
const ORD = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
const SORD = ['♦', '♠', '♥', '♣'];
const deck40 = () => { const d = []; for (const s of SUITS) for (const r of ORD) d.push(r + s); return shuffle(d); };
const mani = vira => ORD[(ORD.indexOf(cRank(vira)) + 1) % 10];
const power = (c, m) => cRank(c) === m ? 100 + SORD.indexOf(cSuit(c)) : ORD.indexOf(cRank(c));
const NEXT = {1: 3, 3: 6, 6: 9, 9: 12};
const NAMES = {3: 'TRUCO', 6: 'SEIS', 9: 'NOVE', 12: 'DOZE'};
function newHand(s) {
const d = deck40();
s.hands = [d.splice(0, 3), d.splice(0, 3)]; s.vira = d.pop(); s.man = mani(s.vira);
s.table = []; s.prev = null; s.vazas = []; s.bet = 1; s.ask = null; s.lastRaiser = -1;
s.mao = 1 - s.mao; s.cur = s.mao; s.handN++; s.msg = '';
}
function endHand(s, winner, why) {
if (winner >= 0) s.pts[winner] += s.bet;
s.msg = winner >= 0 ? `${why ? why + ' · ' : ''}+${s.bet} para ${winner === 0 ? 'A' : 'B'}` : 'Mão empatada';
s.lastHand = {win: winner, bet: s.bet, why};
if (s.pts[0] >= 12 || s.pts[1] >= 12) { s.over = {win: s.pts[0] >= 12 ? 0 : 1}; return; }
newHand(s);
}
function handWinner(v, mao) {
const w = [v.filter(x => x === 0).length, v.filter(x => x === 1).length];
if (w[0] >= 2) return 0; if (w[1] >= 2) return 1;
if (v.length >= 2) {
if (v[0] === -1 && v[1] !== -1) return v[1];
if (v[0] !== -1 && v[1] === -1) return v[0];
}
if (v.length === 3) {
if (v[2] === -1) return v[0] !== -1 ? v[0] : (v[1] !== -1 ? v[1] : mao);
if (v[0] === -1 && v[1] === -1) return v[2];
return v[2];
}
return null;
}
return {
name: 'Truco', min: 2, max: 2, icon: '🂮',
init() { const s = {pts: [0, 0], mao: 1, handN: 0, over: null}; newHand(s); return s; },
view(s, seat) { const v = JSON.parse(JSON.stringify(s)); v.hands = s.hands.map((h, i) => i === seat || seat === -2 ? h : h.length); v.NAMES = NAMES; v.next = NEXT[s.bet] || null; return v; },
turnSeat: s => s.over ? -1 : s.ask ? 1 - s.ask.by : s.cur,
act(s, seat, a) {
if (s.over) return 'Partida acabou.';
const eleven = s.pts[0] === 11 || s.pts[1] === 11;
if (a.op === 'raise') {
if (eleven) return 'Mão de onze: sem truco.';
const base = s.ask ? s.ask.to : s.bet, to = NEXT[base];
if (!to) return 'Já está valendo 12.';
if (s.ask) { if (seat === s.ask.by) return 'Espere a resposta.'; s.bet = s.ask.to; s.ask = {by: seat, to}; s.lastRaiser = seat; s.msg = `${NAMES[to]}!`; return; }
if (seat !== s.cur) return 'Peça truco na sua vez.';
if (s.lastRaiser === seat) return 'Você já pediu; agora é a vez do outro aumentar.';
s.ask = {by: seat, to}; s.lastRaiser = seat; s.msg = `${NAMES[to]}!`; return;
}
if (a.op === 'accept' || a.op === 'run') {
if (!s.ask || seat === s.ask.by) return 'Nada para responder.';
if (a.op === 'accept') { s.bet = s.ask.to; s.ask = null; s.msg = 'Aceito! Vale ' + s.bet; return; }
const by = s.ask.by; s.ask = null; endHand(s, by, 'correu'); return;
}
if (a.op === 'fold') { if (s.ask) return 'Responda o pedido.'; endHand(s, 1 - seat, 'correu'); return; }
if (a.op === 'play') {
if (s.ask) return 'Responda o pedido primeiro.';
if (seat !== s.cur) return 'Não é sua vez.';
const h = s.hands[seat], i = h.indexOf(a.c); if (i < 0) return 'Carta inválida.';
h.splice(i, 1); s.table.push({seat, c: a.c, down: !!a.down && s.vazas.length > 0});
if (s.table.length === 1) { s.cur = 1 - seat; return; }
const [x, y] = s.table, px = x.down ? -1 : power(x.c, s.man), py = y.down ? -1 : power(y.c, s.man);
const w = px === py ? -1 : (px > py ? x.seat : y.seat);
s.vazas.push(w); s.prev = s.table; s.table = [];
const hw = handWinner(s.vazas, s.mao);
if (hw !== null) { endHand(s, hw, ''); return; }
if (s.vazas.length === 3) { endHand(s, s.mao, ''); return; }
s.cur = w === -1 ? x.seat : w; return;
}
return 'Ação inválida.';
},
power, mani, handWinner
};
})();
R.uno = (() => {
const COLS = ['r', 'y', 'g', 'b'];
function deck() {
const d = [];
for (const c of COLS) { d.push(c + '0'); for (let k = 0; k < 2; k++) { for (let n = 1; n <= 9; n++) d.push(c + n); d.push(c + 'S', c + 'R', c + 'D'); } }
for (let k = 0; k < 4; k++) d.push('wW', 'wF');
return shuffle(d);
}
const playable = (c, top, color) => c[0] === 'w' || c[0] === color || c.slice(1) === top.slice(1) && top[0] !== 'w';
function nextSeat(s, from, steps = 1) { let n = from; for (let k = 0; k < steps; k++) { do { n = (n + s.dir + s.hands.length) % s.hands.length; } while (!s.hands[n]); } return n; }
function draw(s, seat, n) { for (let k = 0; k < n; k++) { if (!s.deck.length) { const top = s.disc.pop(); s.deck = shuffle(s.disc.map(c => c[0] === 'w' ? c.slice(0, 2) : c)); s.disc = [top]; } if (s.deck.length) s.hands[seat].push(s.deck.pop()); } }
return {
name: 'Uno', min: 2, max: 8, icon: 'UNO',
init(seats) {
const d = deck(), hands = seats.map(x => x ? d.splice(0, 7) : null);
let top; do { top = d.pop(); if (top[0] === 'w' || 'SRD'.includes(top[1])) { d.unshift(top); top = null; } } while (!top);
return {deck: d, hands, disc: [top], color: top[0], dir: 1, cur: seats.findIndex(x => x), drew: false, over: null, msg: '', uno: {}};
},
view(s, seat) { const v = {...s}; v.deckN = s.deck.length; delete v.deck; v.hands = s.hands.map((h, i) => h ? (i === seat || seat === -2 || s.over ? h : h.length) : null); v.top = s.disc[s.disc.length - 1]; delete v.disc; return v; },
turnSeat: s => s.over ? -1 : s.cur,
act(s, seat, a) {
if (s.over) return 'Partida acabou.';
if (a.op === 'uno') { s.uno[seat] = 1; s.msg = 'UNO!'; return; }
if (seat !== s.cur) return 'Não é sua vez.';
const h = s.hands[seat], top = s.disc[s.disc.length - 1];
if (a.op === 'draw') { if (s.drew) return 'Você já comprou: jogue a carta ou passe.'; draw(s, seat, 1); s.drew = true; s.msg = 'comprou 1'; return; }
if (a.op === 'pass') { if (!s.drew) return 'Compre antes de passar.'; s.drew = false; s.cur = nextSeat(s, seat); return; }
if (a.op === 'play') {
const i = h.indexOf(a.c); if (i < 0) return 'Carta inválida.';
if (s.drew && i !== h.length - 1) return 'Depois de comprar, só pode jogar a carta comprada.';
if (!playable(a.c, top, s.color)) return 'Essa carta não serve.';
if (a.c[0] === 'w' && !COLS.includes(a.col)) return 'Escolha uma cor.';
h.splice(i, 1); s.disc.push(a.c[0] === 'w' ? a.c + a.col : a.c); s.color = a.c[0] === 'w' ? a.col : a.c[0]; s.drew = false;
if (h.length !== 1) delete s.uno[seat];
else if (!s.uno[seat] && !a.uno) { draw(s, seat, 2); s.msg = 'esqueceu o UNO! +2'; }
if (!h.length) { s.over = {win: seat}; return; }
const k = a.c[1], alive = s.hands.filter(Boolean).length;
s.msg = '';
if (k === 'R') { s.dir *= -1; s.cur = alive === 2 ? seat : nextSeat(s, seat); s.msg = 'inverteu'; return; }
if (k === 'S') { s.cur = nextSeat(s, seat, 2); s.msg = 'pulou'; return; }
if (k === 'D') { const t = nextSeat(s, seat); draw(s, t, 2); s.cur = nextSeat(s, seat, 2); s.msg = '+2'; return; }
if (k === 'F') { const t = nextSeat(s, seat); draw(s, t, 4); s.cur = nextSeat(s, seat, 2); s.msg = '+4'; return; }
s.cur = nextSeat(s, seat); return;
}
return 'Ação inválida.';
},
playable
};
})();
R.sinuca = (() => {
const W = 1000, H = 500, BR = 13, PR = 26;
const POCKETS = [[0, 0], [W / 2, -6], [W, 0], [0, H], [W / 2, H + 6], [W, H]];
function rack() {
const balls = [{n: 0, x: 250, y: H / 2}];
const order = [1, 9, 2, 10, 8, 3, 11, 7, 14, 4, 5, 13, 15, 6, 12];
let k = 0; const dx = BR * 2 * 0.8661 + 0.5;
for (let row = 0; row < 5; row++) for (let i = 0; i <= row; i++) balls.push({n: order[k++], x: 700 + row * dx, y: H / 2 + (i - row / 2) * (BR * 2 + 0.5)});
return balls.map(b => ({...b, in: false}));
}
function simulate(balls0, vx, vy, onFrame) {
const b = balls0.map(x => ({...x, vx: 0, vy: 0}));
const cue = b.find(x => x.n === 0); cue.vx = vx; cue.vy = vy;
const ev = {first: null, potted: [], rails: 0};
const DT = 1, FR = 0.987, STOP = 0.02;
for (let step = 0; step < 4000; step++) {
let moving = false;
for (const p of b) {
if (p.in) continue;
p.x += p.vx * DT; p.y += p.vy * DT;
p.vx *= FR; p.vy *= FR;
if (p.vx * p.vx + p.vy * p.vy < STOP * STOP) { p.vx = 0; p.vy = 0; } else moving = true;
for (const [px, py] of POCKETS) { const dx = p.x - px, dy = p.y - py; if (dx * dx + dy * dy < PR * PR) { p.in = true; p.vx = p.vy = 0; ev.potted.push(p.n); break; } }
if (p.in) continue;
if (p.x < BR) { p.x = BR; p.vx = -p.vx * 0.8; ev.rails++; } if (p.x > W - BR) { p.x = W - BR; p.vx = -p.vx * 0.8; ev.rails++; }
if (p.y < BR) { p.y = BR; p.vy = -p.vy * 0.8; ev.rails++; } if (p.y > H - BR) { p.y = H - BR; p.vy = -p.vy * 0.8; ev.rails++; }
}
for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
const p = b[i], q = b[j]; if (p.in || q.in) continue;
const dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
if (d2 >= 4 * BR * BR || d2 === 0) continue;
const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = 2 * BR - d;
p.x -= nx * ov / 2; p.y -= ny * ov / 2; q.x += nx * ov / 2; q.y += ny * ov / 2;
const rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
if (rel > 0) { const imp = rel * 0.98; p.vx -= imp * nx; p.vy -= imp * ny; q.vx += imp * nx; q.vy += imp * ny; moving = true; }
if (ev.first === null && (p.n === 0 || q.n === 0)) ev.first = p.n === 0 ? q.n : p.n;
}
if (onFrame && step % 2 === 0) onFrame(b);
if (!moving) break;
}
return {balls: b.map(x => ({n: x.n, x: Math.round(x.x * 100) / 100, y: Math.round(x.y * 100) / 100, in: x.in})), ev};
}
const grp = n => n === 8 ? 'oito' : n === 0 ? 'branca' : n < 8 ? 'lisas' : 'listradas';
return {
name: 'Sinuca', min: 2, max: 2, icon: '🎱', W, H, BR, POCKETS,
init: () => ({balls: rack(), cur: 0, groups: [null, null], over: null, msg: 'Saída', shot: null, shotN: 0, inHand: false, broke: false}),
view: s => s,
turnSeat: s => s.over ? -1 : s.cur,
act(s, seat, a) {
if (s.over) return 'Partida acabou.';
if (seat !== s.cur) return 'Não é sua vez.';
if (a.op === 'place') {
if (!s.inHand) return 'Sem bola na mão.';
const x = Math.max(BR, Math.min(W - BR, +a.x)), y = Math.max(BR, Math.min(H - BR, +a.y));
if (s.balls.some(b => !b.in && b.n !== 0 && (b.x - x) ** 2 + (b.y - y) ** 2 < 4 * BR * BR)) return 'Lugar ocupado.';
const c = s.balls.find(b => b.n === 0); c.x = x; c.y = y; c.in = false; return;
}
if (a.op !== 'shoot') return 'Ação inválida.';
const vx = +a.vx, vy = +a.vy, sp = Math.sqrt(vx * vx + vy * vy);
if (!isFinite(sp) || sp <= 0.5 || sp > 40.01) return 'Tacada inválida.';
const start = s.balls.map(b => ({...b}));
const {balls, ev} = simulate(start, vx, vy);
s.shot = {start, vx, vy, n: ++s.shotN, by: seat}; s.balls = balls; s.inHand = false;
const me = seat, op = 1 - seat;
const newly = ev.potted.filter(n => n !== 0);
let foul = '', keep = false;
const myG = s.groups[me];
if (ev.potted.includes(0)) foul = 'branca na caçapa';
else if (ev.first === null) foul = 'não tocou em nenhuma bola';
else if (myG && grp(ev.first) !== myG && !(ev.first === 8 && clear({balls: start}, myG))) foul = 'tocou primeiro na bola errada';
if (newly.includes(8)) {
const ok = myG && clear(s, myG, newly) && !foul;
s.over = {win: ok ? me : op, why: ok ? 'matou a 8' : 'a 8 caiu antes da hora'};
s.msg = s.over.why; return;
}
if (!myG && newly.length && !foul) { const g = grp(newly[0]); s.groups[me] = g; s.groups[op] = g === 'lisas' ? 'listradas' : 'lisas'; }
const g2 = s.groups[me];
if (!foul && newly.some(n => !g2 || grp(n) === g2)) keep = true;
if (foul) { s.inHand = true; const c = s.balls.find(b => b.n === 0); if (c.in) { c.in = false; c.x = 250; c.y = H / 2; } }
s.cur = keep ? me : op;
s.msg = foul ? 'Falta: ' + foul + ' (bola na mão)' : newly.length ? `Encaçapou ${newly.join(', ')}` : 'Nada caiu';
},
simulate, grp
};
function clear(s, g, extra) { return s.balls.filter(b => grp(b.n) === g).every(b => b.in || (extra && extra.includes(b.n))); }
})();
const B = () => window.MesaBridge;
const isH = () => !!(B() && B().isHost());
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const kOf = n => String(n || '').trim().toLowerCase();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const GM = 'mestre';
const myKey = () => isH() ? GM : kOf(B().me().name);
const rosterList = () => (B() ? B().roster() : []).filter(p => p && p.id);
const pidName = id => { const p = rosterList().find(r => r.id === id); return p ? p.name : ''; };
const charName = id => { const c = (B().chars() || {})[id]; return (c && c.char) ? c.char : pidName(id); };
const keyToPid = k => { const p = rosterList().find(r => r.role !== 'mestre' && kOf(r.name) === k); return p ? p.id : null; };
const toast = t => { try { B().toast(t); } catch (e) {} };
const GAMES = ['sinuca', 'xadrez', 'uno', 'truco', 'vinteum', 'trinca'];
const GDESC = {sinuca: 'Bola 8 · 2 jogadores', xadrez: '1 contra 1', uno: '2 a 8 jogadores', truco: 'Paulista · 1 contra 1', vinteum: 'Contra a banca · 1 a 5', trinca: 'Pife · 2 a 4 jogadores'};
const GCOL = {sinuca: '#1f6b47', xadrez: '#5b4a3a', uno: '#b3261e', truco: '#7a1a20', vinteum: '#20503a', trinca: '#2b3f7a'};
let H = null;                 // estado autoritativo (só no mestre)
let GV = {};                  // views das mesas (para quem está vendo)
let PV = null;                // view do celular
let codeLoaded = '';
const store = () => 'mesa-x-' + (B().code() || 'sala');
function hostInit() {
if (H && codeLoaded === B().code()) return;
codeLoaded = B().code();
let saved = null; try { saved = JSON.parse(localStorage.getItem(store()) || 'null'); } catch (e) {}
H = {tables: {}, ph: {ids: {}, phones: {}, chats: {}, posts: []}};
if (saved && saved.ph) H.ph = saved.ph;
if (saved && saved.tables) H.tables = saved.tables;
const ids = H.ph.ids;
if (!ids.ordem) ids.ordem = {id: 'ordem', name: 'Ordem · Central', num: '0800 451 0000', color: '#c3161f', npc: true, bio: 'Linha segura. Não compartilhe este número.', verified: true};
}
let saveT = 0;
function hostSave() {
clearTimeout(saveT);
saveT = setTimeout(() => {
const data = {ph: H.ph, tables: H.tables};
for (let tries = 0; tries < 4; tries++) {
try { localStorage.setItem(store(), JSON.stringify(data)); return; } catch (e) {
const all = []; Object.values(H.ph.chats).forEach(c => c.msgs.forEach(m => m.img && all.push(m))); H.ph.posts.forEach(p => p.img && all.push(p));
all.sort((a, b) => a.ts - b.ts).slice(0, Math.max(5, all.length >> 1)).forEach(m => { m.img = ''; m.lost = 1; });
}
}
}, 400);
}
function onHostMsg(pid, m) {
hostInit();
if (!m || typeof m !== 'object') return;
const key = kOf(pidName(pid)); if (!key) return;
if (m.k === 'hello') { ensurePhone(key, pid); syncTo(pid); return; }
if (m.k === 'g') { const e = gameIntent(key, m); if (e) B().sendTo(pid, {k: 'err', t: e}); syncGames(); return; }
if (m.k === 'p') { ensurePhone(key, pid); const e = phoneIntent(key, m); if (e) B().sendTo(pid, {k: 'err', t: e}); syncPhones(); return; }
}
function onPlayerMsg(m) {
if (!m || typeof m !== 'object') return;
if (m.k === 'gv') { const old = GV; GV = m.t || {}; turnCheck(old); renderGames(); renderDockBadges(); return; }
if (m.k === 'pv') { const old = PV; PV = m.v; phoneNotify(old, PV); renderPhone(); renderDockBadges(); return; }
if (m.k === 'err') toast('⚠️ ' + m.t);
}
function send(m) {
if (isH()) { hostInit(); const e = m.k === 'g' ? gameIntent(GM, m) : phoneIntent(GM, m); if (e) toast('⚠️ ' + e); if (m.k === 'g') syncGames(); else syncPhones(); }
else B().toHost(m);
}
function syncTo(pid) {
const key = kOf(pidName(pid));
B().sendTo(pid, {k: 'gv', t: tablesView(key)});
B().sendTo(pid, {k: 'pv', v: phoneView(key)});
}
function syncGames() {
hostSave();
rosterList().forEach(p => { if (p.id !== B().me().id) B().sendTo(p.id, {k: 'gv', t: tablesView(kOf(p.name))}); });
const old = GV; GV = tablesView(GM); turnCheck(old); renderGames(); renderDockBadges();
}
function syncPhones() {
hostSave();
rosterList().forEach(p => { if (p.id !== B().me().id) B().sendTo(p.id, {k: 'pv', v: phoneView(kOf(p.name))}); });
const old = PV; PV = phoneView(GM); phoneNotify(old, PV); renderPhone(); renderDockBadges();
}
function seatCtl(t, i, key) { const s = t.seats[i]; if (!s) return false; return s.key === key || (key === GM && s.npc); }
function perspective(t, key) {
const mine = t.seats.map((s, i) => seatCtl(t, i, key) ? i : -1).filter(i => i >= 0);
if (!mine.length) return key === GM ? -2 : -1;
if (t.state) { const ts = R[t.g].turnSeat(t.state); if (mine.includes(ts)) return ts; }
return mine[0];
}
function tablesView(key) {
const out = {};
Object.values(H.tables).forEach(t => {
const per = perspective(t, key);
out[t.id] = {id: t.id, g: t.g, seats: t.seats, status: t.status, by: t.by, ts: t.ts, per,
mine: t.seats.map((s, i) => seatCtl(t, i, key)),
st: t.state ? R[t.g].view(t.state, per) : null, log: t.log.slice(-6)};
});
return out;
}
function gameIntent(key, m) {
const t = m.tid ? H.tables[m.tid] : null;
const who = key === GM ? (B().me().name || 'Mestre') : (rosterList().find(r => kOf(r.name) === key) || {}).name || key;
const isGM = key === GM;
if (m.op === 'new') {
if (!GAMES.includes(m.g)) return 'Jogo desconhecido.';
const g = R[m.g], id = uid();
H.tables[id] = {id, g: m.g, seats: Array(g.max).fill(null), status: 'lobby', by: who, ts: Date.now(), state: null, log: []};
if (!isGM || m.sitGM) H.tables[id].seats[0] = isGM ? {key: 'npc:' + (m.npc || 'Mestre'), name: m.npc || 'Mestre', npc: true} : {key, name: dispName(key)};
return;
}
if (!t) return 'Mesa não existe mais.';
if (m.op === 'close') { if (!isGM && t.by !== who) return 'Só o Mestre ou quem abriu a mesa pode fechar.'; delete H.tables[t.id]; return; }
if (m.op === 'sit') {
const i = m.seat | 0; if (i < 0 || i >= t.seats.length) return 'Lugar inválido.';
if (t.seats[i]) return 'Lugar ocupado.';
if (t.status === 'play' && !isGM && t.g !== 'vinteum') return 'A partida já começou.';
if (isGM) { const nm = String(m.npc || '').trim().slice(0, 24); if (!nm) return 'Dê um nome ao NPC.'; t.seats[i] = {key: 'npc:' + kOf(nm), name: nm, npc: true}; }
else { const j = t.seats.findIndex(s => s && s.key === key); if (j >= 0) { if (t.status === 'lobby') t.seats[j] = null; else return 'Você já está nessa mesa.'; } t.seats[i] = {key, name: dispName(key)}; }
if (t.state && R[t.g].seatsChanged) R[t.g].seatsChanged(t.state, t.seats);
return;
}
if (m.op === 'leave') {
const i = m.seat | 0; const s = t.seats[i]; if (!s) return;
if (!(s.key === key || isGM)) return 'Esse lugar não é seu.';
if (t.status === 'play' && t.g !== 'vinteum') { if (!isGM) return 'Peça para o Mestre te tirar da partida.'; }
t.seats[i] = null; if (t.state && R[t.g].seatsChanged) R[t.g].seatsChanged(t.state, t.seats);
if (t.status === 'play' && t.g !== 'vinteum') { t.status = 'end'; t.log.push('Partida encerrada: alguém saiu.'); }
return;
}
if (m.op === 'start') {
const n = t.seats.filter(Boolean).length, g = R[t.g];
if (!isGM && !t.seats.some(s => s && s.key === key)) return 'Sente-se para começar.';
if (n < g.min) return `Precisa de pelo menos ${g.min} jogador${g.min > 1 ? 'es' : ''}.`;
if (g.max === 2 && n !== 2) return 'Esse jogo é para 2.';
let seats = t.seats;
if (t.g !== 'vinteum') { seats = t.seats.filter(Boolean); t.seats = seats.concat(Array(g.max - seats.length).fill(null)); }
t.state = g.init(t.g === 'vinteum' ? t.seats : t.seats.slice(0, seats.length)); t.status = 'play'; t.log.push('Começou!');
return;
}
if (m.op === 'act') {
if (!t.state || t.status !== 'play') return 'A partida não está rolando.';
const i = m.seat | 0; if (!seatCtl(t, i, key)) return 'Você não controla esse lugar.';
const before = t.state.over;
const e = R[t.g].act(t.state, i, m.a || {}); if (e) return e;
const tag = describe(t, i, m.a); if (tag) { t.log.push(tag); if (t.log.length > 30) t.log.shift(); }
if (!before && t.state.over) finishTable(t);
return;
}
if (m.op === 'again') {
if (!isGM && !t.seats.some(s => s && s.key === key)) return 'Só quem está na mesa.';
t.state = null; t.status = 'lobby'; t.log.push('Nova partida.'); return gameIntent(key, {...m, op: 'start'});
}
return 'Ação desconhecida.';
}
function dispName(key) { const p = rosterList().find(r => kOf(r.name) === key); return p ? (charName(p.id) || p.name) : key; }
function describe(t, i, a) {
const n = (t.seats[i] || {}).name || '?';
if (!a) return '';
if (t.g === 'truco' && a.op === 'raise') return n + ' pediu ' + ({3: 'TRUCO', 6: 'SEIS', 9: 'NOVE', 12: 'DOZE'}[t.state.ask ? t.state.ask.to : t.state.bet] || 'aumento') + '!';
if (t.g === 'truco' && a.op === 'run') return n + ' correu.';
if (t.g === 'truco' && a.op === 'accept') return n + ' aceitou.';
if (t.g === 'uno' && a.op === 'uno') return n + ' gritou UNO!';
if (t.g === 'xadrez' && a.op === 'resign') return n + ' desistiu.';
return '';
}
function finishTable(t) {
t.status = 'end';
const o = t.state.over, w = o.win >= 0 ? t.seats[o.win] : null;
const gn = R[t.g].name;
const txt = w ? `🏆 ${w.name} venceu no ${gn}${o.why ? ' (' + o.why + ')' : ''}` : `🤝 ${gn} terminou empatado${o.why ? ' (' + o.why + ')' : ''}`;
t.log.push(txt);
try { B().sys('🎲 ' + txt.replace(/^🏆 |^🤝 /, '')); } catch (e) {}
}
const COLS = ['#2d6a4f', '#1f4e79', '#7a1a20', '#6b35c9', '#9a5b16', '#2f7487', '#8f2440', '#4a4e69', '#a0522d', '#3b6e8f'];
const genNum = () => { const ids = H.ph.ids; let n; do { n = `(88) 9${8 + (Math.random() * 2 | 0)}${String(Math.random() * 1e3 | 0).padStart(3, '0')}-${String(Math.random() * 1e4 | 0).padStart(4, '0')}`; } while (Object.values(ids).some(i => i.num === n)); return n; };
const normNum = s => String(s || '').replace(/\D/g, '');
function ensurePhone(key, pid) {
const P = H.ph; let ph = P.phones[key];
const cn = pid ? charName(pid) : key;
if (!ph) {
const id = 'pc_' + uid();
P.ids[id] = {id, name: cn || key, num: genNum(), color: COLS[Object.keys(P.ids).length % COLS.length], npc: false, key, auto: true, bio: ''};
ph = P.phones[key] = {id, has: true, sig: true, off: 0, contacts: ['ordem'], wall: 0};
} else {
const me = P.ids[ph.id]; if (me && me.auto && cn && me.name !== cn) me.name = cn;
}
return ph;
}
function chatFor(a, b) {
const P = H.ph; let c = Object.values(P.chats).find(c => !c.grp && c.mem.length === 2 && c.mem.includes(a) && c.mem.includes(b));
if (!c) { const id = 'c_' + uid(); c = P.chats[id] = {id, mem: [a, b], grp: false, msgs: []}; }
return c;
}
const phoneOfId = idd => { const P = H.ph; const k = Object.keys(P.phones).find(k => P.phones[k].id === idd); return k ? P.phones[k] : null; };
function phoneIntent(key, m) {
const P = H.ph, isGM = key === GM;
const ph = isGM ? null : P.phones[key];
if (!isGM && !ph) return 'Celular não encontrado.';
if (!isGM && !ph.has) return 'Você está sem o celular.';
const meId = isGM ? (m.as && P.ids[m.as] && P.ids[m.as].npc ? m.as : null) : ph.id;
const now = Date.now();
const cleanTx = s => String(s || '').slice(0, 1200);
const okImg = s => typeof s === 'string' && s.startsWith('data:image/') && s.length < 400000 ? s : '';
switch (m.op) {
case 'send': {
if (!meId) return 'Escolha como quem você está falando.';
let c = m.cid ? P.chats[m.cid] : null;
if (!c && m.to && P.ids[m.to]) c = chatFor(meId, m.to);
if (!c || !c.mem.includes(meId)) return 'Conversa inválida.';
const tx = cleanTx(m.tx), img = okImg(m.img); if (!tx.trim() && !img) return;
const msg = {id: uid(), f: meId, tx, img, ts: now};
if (!isGM && !ph.sig) msg.q = 1;
c.msgs.push(msg); if (c.msgs.length > 400) c.msgs.shift();
c.last = now; return;
}
case 'addc': {
if (isGM) return;
const num = normNum(m.num), nm = String(m.name || '').trim().slice(0, 30);
if (num.length < 4) return 'Número inválido.';
let idd = Object.values(P.ids).find(i => normNum(i.num) === num);
if (!idd) { const id = 'npc_' + uid(); idd = P.ids[id] = {id, name: nm || m.num, num: m.num.slice(0, 20), color: COLS[Object.keys(P.ids).length % COLS.length], npc: true, bio: '', by: key}; }
if (idd.id === ph.id) return 'Esse é o seu número.';
if (!ph.contacts.includes(idd.id)) ph.contacts.push(idd.id);
if (nm) { ph.alias = ph.alias || {}; ph.alias[idd.id] = nm; }
return;
}
case 'delc': { if (isGM) return; ph.contacts = ph.contacts.filter(x => x !== m.id); return; }
case 'post': {
if (!meId) return 'Escolha como quem você está postando.';
if (!isGM && !ph.sig) return 'Sem sinal.';
const tx = cleanTx(m.tx), img = okImg(m.img); if (!img && !tx.trim()) return 'Post vazio.';
P.posts.unshift({id: uid(), by: meId, tx, img, ts: now, likes: [], com: []}); if (P.posts.length > 150) P.posts.pop(); return;
}
case 'like': {
if (!meId) return; if (!isGM && !ph.sig) return 'Sem sinal.';
const p = P.posts.find(x => x.id === m.id); if (!p) return;
const i = p.likes.indexOf(meId); if (i >= 0) p.likes.splice(i, 1); else p.likes.push(meId); return;
}
case 'com': {
if (!meId) return; if (!isGM && !ph.sig) return 'Sem sinal.';
const p = P.posts.find(x => x.id === m.id); if (!p) return; const tx = cleanTx(m.tx).slice(0, 300); if (!tx.trim()) return;
p.com.push({by: meId, tx, ts: now}); return;
}
case 'delpost': { const i = P.posts.findIndex(x => x.id === m.id && (isGM || x.by === meId)); if (i >= 0) P.posts.splice(i, 1); return; }
case 'prof': {
const idd = P.ids[isGM ? m.id : ph.id]; if (!idd) return;
if (m.name != null && String(m.name).trim()) { idd.name = String(m.name).trim().slice(0, 30); idd.auto = false; }
if (m.bio != null) idd.bio = String(m.bio).slice(0, 160);
if (m.av != null) idd.av = okImg(m.av);
if (!isGM && m.wall != null) ph.wall = m.wall | 0;
return;
}
case 'grp': {
const mem = (m.mem || []).filter(x => P.ids[x]); if (meId && !mem.includes(meId)) mem.unshift(meId);
if (mem.length < 2) return 'Escolha participantes.';
const id = 'g_' + uid(); P.chats[id] = {id, mem, grp: true, name: String(m.name || 'Grupo').slice(0, 30), msgs: [{id: uid(), f: meId || mem[0], tx: '', sys: 'criou o grupo', ts: now}], last: now};
return;
}
case 'read': { if (isGM) { P.gmRead = P.gmRead || {}; P.gmRead[m.cid] = now; } else { ph.read = ph.read || {}; ph.read[m.cid] = now; } return; }
case 'sig': case 'take': case 'mknpc': case 'give': case 'delnpc': case 'clearchat': {
if (!isGM) return 'Só o Mestre.';
if (m.op === 'sig') { const t = P.phones[m.key]; if (!t) return; t.sig = !!m.on; if (!t.sig) t.off = now; else { Object.values(P.chats).forEach(c => c.msgs.forEach(x => { if (x.q && x.f === t.id) { delete x.q; x.ts = now; c.last = now; } })); t.off = 0; } return; }
if (m.op === 'take') { const t = P.phones[m.key]; if (t) t.has = !m.on; return; }
if (m.op === 'mknpc') { const nm = String(m.name || '').trim().slice(0, 30); if (!nm) return 'Nome?'; const id = 'npc_' + uid(); P.ids[id] = {id, name: nm, num: m.num ? String(m.num).slice(0, 20) : genNum(), color: COLS[Object.keys(P.ids).length % COLS.length], npc: true, bio: String(m.bio || '').slice(0, 160)}; return; }
if (m.op === 'give') { const t = P.phones[m.key]; if (t && P.ids[m.id] && !t.contacts.includes(m.id) && t.id !== m.id) t.contacts.push(m.id); return; }
if (m.op === 'delnpc') { if (m.id === 'ordem') return 'A Ordem fica.'; delete P.ids[m.id]; Object.values(P.phones).forEach(t => t.contacts = t.contacts.filter(x => x !== m.id)); return; }
if (m.op === 'clearchat') { delete P.chats[m.cid]; return; }
}
}
return 'Ação desconhecida.';
}
function visibleMsgs(c, ph) {
return c.msgs.filter(x => {
if (x.q && (!ph || x.f !== ph.id)) return false;
if (ph && !ph.sig && ph.off && x.f !== ph.id && x.ts > ph.off) return false;
return true;
});
}
function phoneView(key) {
hostInit();
const P = H.ph;
if (key === GM) {
return {gm: true, ids: P.ids, chats: Object.values(P.chats).map(c => ({...c, msgs: c.msgs})), posts: P.posts,
phones: Object.entries(P.phones).map(([k, ph]) => ({key: k, ...ph, online: !!keyToPid(k)})), read: P.gmRead || {}};
}
const ph = P.phones[key]; if (!ph) return null;
const me = P.ids[ph.id];
const chats = Object.values(P.chats).filter(c => c.mem.includes(ph.id)).map(c => ({...c, msgs: visibleMsgs(c, ph)})).filter(c => c.grp || c.msgs.length || true);
const need = new Set([ph.id, ...ph.contacts]); chats.forEach(c => c.mem.forEach(x => need.add(x)));
const posts = P.posts.filter(p => ph.sig || !ph.off || p.ts <= ph.off);
posts.forEach(p => { need.add(p.by); p.likes.forEach(x => need.add(x)); p.com.forEach(c => need.add(c.by)); });
const ids = {}; need.forEach(x => { if (P.ids[x]) ids[x] = P.ids[x]; });
return {me, has: ph.has, sig: ph.sig, contacts: ph.contacts, alias: ph.alias || {}, chats, posts, ids, wall: ph.wall || 0, read: ph.read || {}};
}
const CSS = `
.mx-ov *,.mxp-wrap *{box-sizing:border-box}
.mx-ov{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;background:rgba(5,5,7,.72);backdrop-filter:blur(6px);animation:mxIn .18s ease}
@keyframes mxIn{from{opacity:0}to{opacity:1}}
.mx-win{width:min(1180px,96vw);height:min(760px,92vh);background:linear-gradient(180deg,#141418,#0d0d10);border:1px solid #2a2a31;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden;color:#ecebe8;font-family:Inter,system-ui,sans-serif}
.mx-hd{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #222228;background:rgba(255,255,255,.02)}
.mx-hd h3{margin:0;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:.06em;font-size:24px;font-weight:400}
.mx-hd h3 span{color:#c3161f}
.mx-sp{flex:1}
.mx-b{display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border-radius:10px;background:#1e1e24;border:1px solid #2c2c34;color:#ecebe8;font-size:13px;font-weight:600;cursor:pointer;transition:.12s}
.mx-b:hover{background:#26262e;border-color:#3a3a44}.mx-b:active{transform:scale(.97)}
.mx-b.red{background:#c3161f;border-color:#c3161f;color:#fff}.mx-b.red:hover{background:#d9222c}
.mx-b.gold{background:#d8a74a;border-color:#d8a74a;color:#1a1306}
.mx-b.grn{background:#2d8a55;border-color:#2d8a55;color:#fff}
.mx-b.ghost{background:transparent}
.mx-b[disabled]{opacity:.4;pointer-events:none}
.mx-x{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#1e1e24;font-size:18px;cursor:pointer;border:1px solid #2c2c34;color:#ccc}
.mx-body{flex:1;min-height:0;display:flex}
.mx-scroll{overflow:auto;flex:1;padding:18px}
.mx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
.mx-gc{position:relative;border-radius:14px;padding:16px 14px 14px;min-height:118px;cursor:pointer;overflow:hidden;border:1px solid rgba(255,255,255,.08);transition:.15s;display:flex;flex-direction:column;justify-content:flex-end}
.mx-gc:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.45)}
.mx-gc .ic{position:absolute;right:14px;top:12px;font-size:40px;line-height:1;opacity:.9;filter:drop-shadow(0 4px 8px rgba(0,0,0,.4));font-weight:900;font-family:Georgia,serif}
.mx-gc b{font-size:18px;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:.05em;font-weight:400}
.mx-gc small{opacity:.75;font-size:12px}
.mx-sec{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8e8b93;margin:22px 0 10px;font-weight:700}
.mx-tl{display:flex;flex-direction:column;gap:8px}
.mx-tr{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:#17171c;border:1px solid #24242b}
.mx-tr .gi{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;font-size:20px;flex:none}
.mx-pill{font-size:11px;padding:3px 8px;border-radius:99px;background:#24242b;color:#bbb;font-weight:700}
.mx-pill.on{background:#2d8a55;color:#fff}.mx-pill.turn{background:#d8a74a;color:#1a1306}.mx-pill.end{background:#3a2a2d;color:#e6a}
.mx-seats{display:flex;flex-wrap:wrap;gap:6px}
.mx-seat{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:99px;background:#1e1e24;border:1px dashed #3a3a44;font-size:12px}
.mx-seat.f{border-style:solid;background:#22222a}.mx-seat.me{border-color:#d8a74a}.mx-seat.cur{box-shadow:0 0 0 2px #d8a74a}
.mx-seat i{width:8px;height:8px;border-radius:50%;background:#555;display:inline-block}.mx-seat.f i{background:#3ba55d}.mx-seat.npc i{background:#c3161f}
.mx-tb{flex:1;display:flex;min-width:0}
.mx-stage{flex:1;min-width:0;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:safe center;padding:14px;overflow:auto;background:radial-gradient(ellipse at center,#16241c 0%,#0d120f 70%)}
.mx-stage.dark{background:radial-gradient(ellipse at center,#1b1b22,#0b0b0e 75%)}
.mx-stage.felt{background:radial-gradient(ellipse at center,#1d5a3a 0%,#0f3322 65%,#0a1f15 100%)}
.mx-stage.wine{background:radial-gradient(ellipse at center,#5a1418 0%,#2a0a0d 70%,#140507 100%)}
.mx-side{width:270px;flex:none;border-left:1px solid #222228;display:flex;flex-direction:column;background:#101013}
.mx-side .mx-scroll{padding:14px}
.mx-log{font-size:12px;color:#aaa;display:flex;flex-direction:column;gap:5px}
.mx-log div{padding:6px 8px;background:#17171c;border-radius:8px}
.mx-status{font-size:14px;font-weight:700;padding:8px 14px;border-radius:99px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.08);margin-bottom:10px;text-align:center}
.mx-status.turn{background:#d8a74a;color:#1a1306;border-color:#d8a74a;animation:mxPulse 1.6s infinite}
@keyframes mxPulse{50%{box-shadow:0 0 0 6px rgba(216,167,74,.18)}}
.mx-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center}
.mx-hand{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;margin-top:10px}
.mx-lbl{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.6);font-weight:700;margin:6px 0}
.mxc{width:66px;height:94px;border-radius:9px;background:linear-gradient(160deg,#fffdf7,#efe8da);color:#16161a;position:relative;box-shadow:0 2px 0 rgba(0,0,0,.25),0 8px 16px rgba(0,0,0,.35);font-family:Georgia,'Times New Roman',serif;flex:none;transition:transform .15s,box-shadow .15s;user-select:none}
.mxc.r{color:#c3161f}
.mxc .tl,.mxc .br{position:absolute;font-weight:700;line-height:.9;text-align:center;font-size:15px}
.mxc .tl{left:6px;top:5px}.mxc .br{right:6px;bottom:5px;transform:rotate(180deg)}
.mxc .tl small,.mxc .br small{display:block;font-size:13px}
.mxc .ct{position:absolute;inset:0;display:grid;place-items:center;font-size:34px}
.mxc.face .ct{font-size:28px;font-weight:700}
.mxc.back{background:repeating-linear-gradient(45deg,#5c0a10 0 6px,#4a070c 6px 12px);border:3px solid #f2ebde}
.mxc.back::after{content:'';position:absolute;inset:16px 10px;border:2px solid rgba(255,255,255,.35);border-radius:50%}
.mxc.sm{width:44px;height:63px;border-radius:7px}.mxc.sm .tl{font-size:12px;left:4px;top:3px}.mxc.sm .br{display:none}.mxc.sm .ct{font-size:22px}.mxc.sm.back::after{inset:10px 7px}
.mxc.pick{cursor:pointer}.mxc.pick:hover{transform:translateY(-8px)}
.mxc.sel{transform:translateY(-14px);box-shadow:0 0 0 3px #d8a74a,0 12px 20px rgba(0,0,0,.4)}
.mxc.dim{opacity:.45}
.mxc.mani{box-shadow:0 0 0 3px #d8a74a,0 8px 16px rgba(0,0,0,.35)}
.mx-fan{display:flex}.mx-fan .mxc{margin-left:-30px}.mx-fan .mxc:first-child{margin-left:0}.mx-fan .mxu{margin-left:-24px}.mx-fan .mxu:first-child{margin-left:0}
.mxu{width:66px;height:98px;border-radius:10px;border:4px solid #fff;position:relative;display:grid;place-items:center;font-family:'Arial Black',Impact,sans-serif;color:#fff;box-shadow:0 8px 16px rgba(0,0,0,.4);flex:none;user-select:none;transition:transform .15s}
.mxu::before{content:'';position:absolute;inset:8px 6px;background:#fff;border-radius:50%;transform:rotate(25deg) scaleX(.72)}
.mxu b{position:relative;font-size:30px;text-shadow:2px 2px 0 rgba(0,0,0,.35);-webkit-text-stroke:1px rgba(0,0,0,.25)}
.mxu i{position:absolute;font-style:normal;font-size:13px;left:5px;top:3px;color:#fff}
.mxu.r{background:#d72600}.mxu.y{background:#ecd407}.mxu.g{background:#379711}.mxu.b{background:#0956bf}.mxu.w{background:conic-gradient(#d72600 0 25%,#ecd407 0 50%,#379711 0 75%,#0956bf 0)}
.mxu.r b{color:#d72600}.mxu.y b{color:#d4b800}.mxu.g b{color:#379711}.mxu.b b{color:#0956bf}.mxu.w b{color:#111}
.mxu.back{background:#111;}.mxu.back b{color:#d72600;font-size:16px;transform:rotate(-20deg)}
.mxu.pick{cursor:pointer}.mxu.pick:hover{transform:translateY(-8px)}.mxu.no{opacity:.45}
.mxu.sm{width:42px;height:62px;border-width:3px}.mxu.sm b{font-size:18px}.mxu.sm i{display:none}
.mx-colpick{display:flex;gap:10px}.mx-colpick button{width:54px;height:54px;border-radius:50%;border:3px solid #fff;cursor:pointer}
.mx-board{display:grid;grid-template-columns:repeat(8,1fr);width:min(560px,70vh,90vw);aspect-ratio:1;border:10px solid #3b2a1c;border-radius:6px;box-shadow:0 16px 40px rgba(0,0,0,.6)}
.mx-sq{position:relative;display:grid;place-items:center;cursor:pointer;font-size:min(50px,6vh);line-height:1;user-select:none}
.mx-sq.l{background:#e8d6b0}.mx-sq.d{background:#a77c52}
.mx-sq.last{box-shadow:inset 0 0 0 100px rgba(216,167,74,.38)}
.mx-sq.sel{box-shadow:inset 0 0 0 100px rgba(80,160,255,.45)}
.mx-sq.chk{box-shadow:inset 0 0 22px 6px #e01a1a}
.mx-sq .dot{position:absolute;width:26%;height:26%;border-radius:50%;background:rgba(20,20,20,.32)}
.mx-sq .ring{position:absolute;inset:6%;border-radius:50%;border:5px solid rgba(20,20,20,.3)}
.mx-sq .cd{position:absolute;font-size:10px;font-family:Inter,sans-serif;font-weight:700;opacity:.55;left:3px;top:2px}
.mx-pc{filter:drop-shadow(0 2px 2px rgba(0,0,0,.45))}.mx-pc.w{color:#fff;-webkit-text-stroke:1.5px #222}.mx-pc.b{color:#151515}
.mx-cap{font-size:22px;min-height:26px;letter-spacing:-2px}
.mx-pool{width:min(100%,980px);touch-action:none;cursor:crosshair;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.6)}
.mx-power{height:8px;width:260px;border-radius:9px;background:#222;overflow:hidden}.mx-power b{display:block;height:100%;background:linear-gradient(90deg,#3ba55d,#d8a74a,#c3161f)}
.mx-balls{display:flex;gap:4px;align-items:center}.mx-balls i{width:16px;height:16px;border-radius:50%;display:inline-block;font-size:8px;font-style:normal;text-align:center;line-height:16px;color:#111;font-weight:800}
.mx-score{display:flex;gap:16px;align-items:center;font-family:'Bebas Neue',Impact,sans-serif;font-size:28px;letter-spacing:.04em}
.mx-score span{font-size:12px;font-family:Inter;color:#aaa;letter-spacing:0}
.mx-vz{display:flex;gap:5px}.mx-vz i{width:12px;height:12px;border-radius:50%;background:#333;display:inline-block}.mx-vz i.w{background:#3ba55d}.mx-vz i.l{background:#c3161f}.mx-vz i.t{background:#888}
.mx-ask{padding:14px 18px;border-radius:14px;background:#c3161f;color:#fff;font-family:'Bebas Neue',Impact,sans-serif;font-size:34px;letter-spacing:.06em;text-align:center;box-shadow:0 10px 30px rgba(195,22,31,.5);animation:mxPulse 1s infinite}
.mx-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:99px;background:rgba(0,0,0,.4);font-weight:700;font-size:12px}
.mx-chip::before{content:'';width:12px;height:12px;border-radius:50%;background:radial-gradient(circle,#fff 25%,#c3161f 26% 60%,#fff 61% 70%,#c3161f 71%)}
.mx-seatbox{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px;border-radius:14px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.06);min-width:150px}
.mx-seatbox.cur{border-color:#d8a74a;box-shadow:0 0 0 2px rgba(216,167,74,.35)}
.mx-nm{font-weight:700;font-size:13px}
.mx-modal{position:absolute;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;z-index:5}
.mx-modal>div{background:#16161b;border:1px solid #2c2c34;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:12px;align-items:center;min-width:260px}
.mx-in{background:#0c0c0f;border:1px solid #2c2c34;border-radius:10px;padding:9px 11px;color:#eee;font:inherit;width:100%}
@media (max-width:820px){.mx-side{display:none}.mx-win{width:100vw;height:100vh;border-radius:0}.mxc{width:52px;height:76px}.mxc .ct{font-size:26px}}
.mxp-wrap{position:fixed;right:22px;bottom:84px;z-index:290;animation:mxUp .22s ease}
@keyframes mxUp{from{transform:translateY(30px);opacity:0}}
.mxp{width:340px;height:min(700px,calc(100vh - 130px));border-radius:46px;background:#000;padding:10px;box-shadow:0 0 0 2px #2a2a2e,0 0 0 9px #0c0c0e,0 30px 70px rgba(0,0,0,.7);position:relative;font-family:-apple-system,'SF Pro Text',Inter,system-ui,sans-serif;color:#fff}
.mxp-scr{position:relative;width:100%;height:100%;border-radius:37px;overflow:hidden;background:#000;display:flex;flex-direction:column}
.mxp-notch{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:96px;height:26px;border-radius:20px;background:#000;z-index:6}
.mxp-sb{height:44px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:6px 26px 0;font-size:13px;font-weight:600;z-index:5;position:relative}
.mxp-sb .sig{display:flex;align-items:flex-end;gap:2px;height:11px}.mxp-sb .sig i{width:3px;background:#fff;border-radius:1px}.mxp-sb .sig i.o{opacity:.25}
.mxp-sb .bat{width:22px;height:11px;border:1.5px solid rgba(255,255,255,.75);border-radius:3px;position:relative;padding:1px}.mxp-sb .bat b{display:block;height:100%;background:#fff;border-radius:1px}
.mxp-home{flex:1;display:flex;flex-direction:column;padding:10px 22px 22px;background-size:cover}
.mxp-clock{font-size:64px;font-weight:300;text-align:center;letter-spacing:-.02em;margin-top:18px;text-shadow:0 2px 12px rgba(0,0,0,.35)}
.mxp-date{text-align:center;font-size:15px;opacity:.85;margin-top:-4px}
.mxp-apps{display:grid;grid-template-columns:repeat(4,1fr);gap:18px 10px;margin-top:auto}
.mxp-app{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;font-size:11px;position:relative}
.mxp-app .ai{width:56px;height:56px;border-radius:15px;display:grid;place-items:center;font-size:28px;box-shadow:0 4px 12px rgba(0,0,0,.35)}
.mxp-app .bd{position:absolute;right:4px;top:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#ff3b30;font-size:12px;font-weight:700;display:grid;place-items:center}
.mxp-dockbar{margin-top:18px;padding:10px;border-radius:26px;background:rgba(255,255,255,.18);backdrop-filter:blur(14px);display:flex;justify-content:space-around}
.mxp-ind{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:120px;height:5px;border-radius:3px;background:rgba(255,255,255,.85);z-index:7;cursor:pointer}
.mxp-ap{flex:1;display:flex;flex-direction:column;min-height:0;background:#0b141a}
.mxp-top{display:flex;align-items:center;gap:10px;padding:8px 14px 10px;background:#1f2c34;flex:none}
.mxp-top .bk{font-size:24px;cursor:pointer;color:#8696a0;width:22px}
.mxp-top b{font-size:17px;flex:1}
.mxp-list{flex:1;overflow:auto}
.mxp-it{display:flex;gap:12px;align-items:center;padding:10px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04)}
.mxp-it:hover{background:rgba(255,255,255,.04)}
.mxp-av{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:18px;flex:none;background-size:cover;background-position:center;color:#fff}
.mxp-av.s{width:34px;height:34px;font-size:14px}.mxp-av.xs{width:28px;height:28px;font-size:12px}
.mxp-it .tx{flex:1;min-width:0}.mxp-it .tx b{display:block;font-size:15px;font-weight:600}.mxp-it .tx small{display:block;color:#8696a0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mxp-it .tm{font-size:11px;color:#8696a0;text-align:right}.mxp-it .tm .n{display:inline-grid;place-items:center;min-width:20px;height:20px;border-radius:10px;background:#25d366;color:#0b141a;font-weight:700;margin-top:4px;padding:0 5px}
.mxp-chat{flex:1;overflow:auto;padding:10px 12px;display:flex;flex-direction:column;gap:3px;background:#0b141a url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='.035' stroke-width='1.5'%3E%3Ccircle cx='20' cy='20' r='7'/%3E%3Cpath d='M55 15l8 8M63 15l-8 8M15 55h12M60 60a6 6 0 1 0 1 0'/%3E%3C/g%3E%3C/svg%3E")}
.mxp-m{max-width:80%;padding:6px 9px 4px;border-radius:9px;font-size:14px;line-height:1.35;position:relative;word-wrap:break-word;white-space:pre-wrap;box-shadow:0 1px 1px rgba(0,0,0,.2)}
.mxp-m.o{align-self:flex-end;background:#005c4b;border-top-right-radius:2px}
.mxp-m.i{align-self:flex-start;background:#202c33;border-top-left-radius:2px}
.mxp-m .who{font-size:12px;font-weight:700;margin-bottom:2px}
.mxp-m .mt{font-size:10px;color:rgba(255,255,255,.6);float:right;margin:6px 0 -2px 10px}
.mxp-m .mt .ck{color:#53bdeb}
.mxp-m img{display:block;max-width:100%;border-radius:6px;margin:2px 0}
.mxp-sys{align-self:center;font-size:11.5px;background:#182229;color:#8696a0;padding:4px 10px;border-radius:7px;margin:6px 0}
.mxp-in{display:flex;gap:6px;align-items:flex-end;padding:7px 8px 22px;background:#0b141a;flex:none}
.mxp-in textarea{flex:1;resize:none;border:0;border-radius:20px;padding:10px 14px;background:#2a3942;color:#fff;font:inherit;font-size:14px;max-height:90px;outline:none}
.mxp-in button{width:42px;height:42px;border-radius:50%;background:#00a884;color:#fff;font-size:18px;display:grid;place-items:center;flex:none;cursor:pointer;border:0}
.mxp-in button.g{background:#2a3942}
.mxp-ban{background:#3b1d12;color:#ffb38a;font-size:12px;padding:6px 12px;text-align:center;flex:none}
.mxp-fab{position:absolute;right:16px;bottom:30px;width:54px;height:54px;border-radius:16px;background:#00a884;display:grid;place-items:center;font-size:24px;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.4)}
.mxp-form{padding:14px;display:flex;flex-direction:column;gap:10px}
.mxp-form input,.mxp-form textarea,.mxp-form select{background:#1f2c34;border:1px solid #2a3942;border-radius:10px;padding:10px 12px;color:#fff;font:inherit;outline:none;width:100%}
.mxp-btn{padding:11px;border-radius:12px;background:#00a884;color:#fff;text-align:center;font-weight:700;cursor:pointer;border:0;font:inherit;font-weight:700}
.mxp-btn.g{background:#2a3942}.mxp-btn.r{background:#c3161f}
.mxp-ig{flex:1;display:flex;flex-direction:column;min-height:0;background:#000}
.mxp-igtop{display:flex;align-items:center;gap:12px;padding:6px 14px 10px;border-bottom:1px solid #1a1a1a}
.mxp-igtop .lg{font-family:'Brush Script MT','Segoe Script',cursive;font-size:28px;flex:1}
.mxp-post{border-bottom:1px solid #161616;padding-bottom:10px}
.mxp-ph{display:flex;align-items:center;gap:9px;padding:9px 12px;font-weight:600;font-size:13.5px}
.mxp-ring{padding:2px;border-radius:50%;background:linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)}.mxp-ring .mxp-av{border:2px solid #000}
.mxp-pimg{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#111}
.mxp-ptx{aspect-ratio:1;display:grid;place-items:center;padding:24px;text-align:center;font-size:20px;font-weight:700;background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)}
.mxp-pa{display:flex;gap:14px;padding:8px 12px 2px;font-size:24px}.mxp-pa span{cursor:pointer}
.mxp-pl{padding:0 12px;font-size:13.5px}.mxp-pl b{font-weight:600}
.mxp-pc{padding:2px 12px;font-size:13px;color:#ddd}
.mxp-pci{display:flex;padding:4px 12px}.mxp-pci input{flex:1;background:none;border:0;color:#fff;font:inherit;font-size:13px;outline:none}
.mxp-off{flex:1;display:grid;place-items:center;text-align:center;padding:30px;color:#aaa;font-size:15px;background:#000}
.mxp-off b{display:block;font-size:44px;margin-bottom:12px}
.mxp-gm{display:flex;gap:6px;align-items:center;padding:4px 12px 8px;background:#1f2c34;font-size:12px;color:#8696a0}
.mxp-gm select{flex:1;background:#2a3942;border:0;border-radius:8px;color:#fff;padding:6px;font:inherit;font-size:12.5px}
.mxp-sw{width:42px;height:24px;border-radius:12px;background:#3a3a3e;position:relative;cursor:pointer;flex:none;transition:.15s}
.mxp-sw::after{content:'';position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.15s}
.mxp-sw.on{background:#30d158}.mxp-sw.on::after{left:21px}
.mxp-card{margin:10px 12px;padding:12px;border-radius:14px;background:#1f2c34;display:flex;flex-direction:column;gap:8px}
.mxp-card .r{display:flex;align-items:center;gap:10px;font-size:13.5px}
.mxp-chk{display:flex;align-items:center;gap:10px;padding:8px 14px;cursor:pointer}
.mxp-chk input{width:18px;height:18px}
.mxp-x{position:absolute;right:-12px;top:-12px;width:34px;height:34px;border-radius:50%;background:#1e1e24;border:1px solid #333;color:#ddd;display:grid;place-items:center;cursor:pointer;z-index:10;font-size:16px}
.mxp-spy{position:absolute;left:0;right:0;top:-34px;text-align:center;font-size:12px;font-weight:700;color:#d8a74a}
@media (max-width:640px){.mxp-wrap{right:0;left:0;bottom:0;top:0;display:grid;place-items:center;background:rgba(0,0,0,.6)}.mxp{width:min(360px,96vw);height:min(720px,92vh)}}
`;
let cssDone = false;
function ensureCSS() { if (cssDone) return; cssDone = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }
const SVG_G = '<svg class="ic" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="6"/><path d="M6 12h4M8 10v4"/><circle cx="15.5" cy="11" r="1"/><circle cx="17.5" cy="13" r="1"/></svg>';
const SVG_P = '<svg class="ic" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>';
function myTurns() { return Object.values(GV).filter(t => t.status === 'play' && t.st && t.mine[R[t.g].turnSeat(t.st)]); }
function unreadTotal() { if (!PV) return 0; let n = 0; chatsFor(PV).forEach(c => n += unreadOf(c)); return n; }
function dockHTML(cbw) {
const g = myTurns().length, u = unreadTotal(), off = PV && !PV.gm && !PV.has;
return cbw('mxg', SVG_G + (g ? '<i class="dot"></i>' : ''), 'Jogos', gOpen ? 'act' : '') + cbw('mxp', SVG_P + (u ? '<i class="dot"></i>' : ''), off ? 'Sem celular' : 'Celular', (pOpen ? 'act' : '') + (off ? ' off' : ''));
}
function onDock(k) { if (k === 'mxg') { gOpen ? closeGames() : openGames(); return true; } if (k === 'mxp') { pOpen ? closePhone() : openPhone(); return true; } return false; }
let badgeT = 0;
function renderDockBadges() { clearTimeout(badgeT); badgeT = setTimeout(() => { try { B().refresh(); } catch (e) {} }, 60); }
function turnCheck(old) {
myTurns().forEach(t => { const o = old[t.id]; const was = o && o.st && o.mine[R[o.g].turnSeat(o.st)]; if (!was) { toast(`🎲 Sua vez no ${R[t.g].name}`); beep(660, .08); } });
}
let actx = null;
function beep(f, d, type) { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = .06; g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + d + .05); o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + d + .06); } catch (e) {} }
let gOpen = false, gTab = 'lobby', gEl = null, sel = {};
function openGames(tab) { ensureCSS(); gOpen = true; if (tab) gTab = tab; renderGames(); renderDockBadges(); }
function closeGames() { gOpen = false; if (gEl) gEl.remove(); gEl = null; stopPool(); renderDockBadges(); }
function gAct(t, a) { send({k: 'g', op: 'act', tid: t.id, seat: t.per, a}); }
function renderGames() {
if (!gOpen) return;
if (!gEl) {
gEl = document.createElement('div'); gEl.className = 'mx-ov'; document.body.appendChild(gEl);
gEl.addEventListener('click', onGClick); gEl.addEventListener('change', onGClick);
gEl.addEventListener('mousedown', e => { if (e.target === gEl) closeGames(); });
}
if (gTab !== 'lobby' && !GV[gTab]) gTab = 'lobby';
const t = GV[gTab];
const head = `<div class="mx-hd">${t ? `<button class="mx-b ghost" data-a="lobby">‹ Salão</button>` : ''}<h3>${t ? esc(R[t.g].name.toUpperCase()) : 'SALÃO DE <span>JOGOS</span>'}</h3>${t ? statusPill(t) : ''}<div class="mx-sp"></div>${t && (isH() || t.by === (B().me().name)) ? `<button class="mx-b ghost" data-a="close" title="Fechar a mesa">Fechar mesa</button>` : ''}<button class="mx-x" data-a="x" title="Fechar (o jogo continua)">✕</button></div>`;
const keepScroll = gEl.querySelector('.mx-scroll') ? gEl.querySelector('.mx-scroll').scrollTop : 0;
if (!t) { gEl.innerHTML = `<div class="mx-win">${head}<div class="mx-body"><div class="mx-scroll">${lobbyHTML()}</div></div></div>`; const sc = gEl.querySelector('.mx-scroll'); if (sc) sc.scrollTop = keepScroll; stopPool(); return; }
gEl.innerHTML = `<div class="mx-win">${head}<div class="mx-body"><div class="mx-tb"><div class="mx-stage ${stageCls(t)}" id="mxStage">${tableHTML(t)}</div><div class="mx-side"><div class="mx-scroll">${sideHTML(t)}</div></div></div></div></div>`;
afterTable(t);
}
const stageCls = t => ({sinuca: 'dark', xadrez: 'dark', uno: 'dark', truco: 'wine', vinteum: 'felt', trinca: 'felt'}[t.g]);
function statusPill(t) { const ts = t.st ? R[t.g].turnSeat(t.st) : -1; return t.status === 'lobby' ? '<span class="mx-pill">esperando</span>' : t.status === 'end' ? '<span class="mx-pill end">fim</span>' : t.mine[ts] ? '<span class="mx-pill turn">sua vez</span>' : '<span class="mx-pill on">rolando</span>'; }
function lobbyHTML() {
let h = `<div class="mx-sec" style="margin-top:0">Abrir uma mesa</div><div class="mx-grid">`;
GAMES.forEach(g => { h += `<div class="mx-gc" data-a="new" data-g="${g}" style="background:linear-gradient(150deg,${GCOL[g]},#111 130%)"><span class="ic">${g === 'uno' ? '<b style="font-family:Arial Black;font-size:26px;color:#fff;background:#111;padding:4px 8px;border-radius:8px;border:3px solid #fff;display:inline-block;transform:rotate(-8deg)">UNO</b>' : R[g].icon}</span><b>${esc(R[g].name)}</b><small>${GDESC[g]}</small></div>`; });
h += `</div><div class="mx-sec">Mesas na sala</div>`;
const ts = Object.values(GV).sort((a, b) => b.ts - a.ts);
if (!ts.length) h += `<div style="color:#8e8b93;font-size:14px">Nenhuma mesa aberta ainda. Escolha um jogo acima.</div>`;
h += '<div class="mx-tl">';
ts.forEach(t => {
const ts2 = t.st ? R[t.g].turnSeat(t.st) : -1;
h += `<div class="mx-tr"><div class="gi" style="background:${GCOL[t.g]}">${R[t.g].icon.length > 2 ? '<b style="font-size:11px">' + R[t.g].icon + '</b>' : R[t.g].icon}</div><div style="flex:1;min-width:0"><b>${esc(R[t.g].name)}</b> <span style="color:#8e8b93;font-size:12px">· aberta por ${esc(t.by)}</span><div class="mx-seats" style="margin-top:6px">${t.seats.map((s, i) => s ? `<span class="mx-seat f ${s.npc ? 'npc' : ''} ${t.mine[i] ? 'me' : ''} ${i === ts2 ? 'cur' : ''}"><i></i>${esc(s.name)}</span>` : '').join('')}${t.seats.filter(x => !x).length && t.status === 'lobby' ? `<span class="mx-seat">${t.seats.filter(x => !x).length} vaga(s)</span>` : ''}</div></div>${statusPill(t)}<button class="mx-b ${t.mine.some(Boolean) ? 'red' : ''}" data-a="open" data-t="${t.id}">${t.mine.some(Boolean) ? 'Jogar' : t.status === 'lobby' ? 'Entrar' : 'Assistir'}</button></div>`;
});
return h + '</div>';
}
function seatsPanel(t) {
const ts = t.st ? R[t.g].turnSeat(t.st) : -1;
let h = `<div class="mx-sec" style="margin-top:0">Lugares</div><div style="display:flex;flex-direction:column;gap:6px">`;
t.seats.forEach((s, i) => {
if (!s && t.status !== 'lobby' && t.g !== 'vinteum') return;
h += `<div style="display:flex;align-items:center;gap:6px"><span class="mx-seat ${s ? 'f' : ''} ${s && s.npc ? 'npc' : ''} ${t.mine[i] ? 'me' : ''} ${i === ts ? 'cur' : ''}" style="flex:1"><i></i>${s ? esc(s.name) + (s.npc ? ' <small style="opacity:.6">(NPC)</small>' : '') : 'vago'}</span>`;
if (!s) { h += `<button class="mx-b" data-a="sit" data-i="${i}">Sentar</button>`; if (isH()) h += `<button class="mx-b" data-a="npc" data-i="${i}" title="Pôr um NPC (você joga por ele)">NPC</button>`; }
else if (t.mine[i] || isH()) h += `<button class="mx-b ghost" data-a="leave" data-i="${i}" title="Sair do lugar">✕</button>`;
h += `</div>`;
});
h += `</div>`;
if (t.status === 'lobby') h += `<button class="mx-b red" style="width:100%;margin-top:12px;justify-content:center" data-a="start">▶ Começar partida</button>`;
if (t.status === 'end') h += `<button class="mx-b red" style="width:100%;margin-top:12px;justify-content:center" data-a="again">↻ Jogar de novo</button>`;
return h;
}
function sideHTML(t) {
return seatsPanel(t) + `<div class="mx-sec">Lances</div><div class="mx-log">${t.log.slice().reverse().map(x => `<div>${esc(x)}</div>`).join('') || '<div>—</div>'}</div>` + (isH() ? `<div class="mx-sec">Mestre</div><div style="font-size:12px;color:#8e8b93">Você pode sentar NPCs e jogar por eles. O resultado vai para o chat.</div>` : '');
}
function tableHTML(t) {
if (t.status === 'lobby' || !t.st) {
return `<div style="text-align:center"><div style="font-size:84px">${R[t.g].icon.length > 2 ? '<b style="font-family:Arial Black;color:#d72600">UNO</b>' : R[t.g].icon}</div><h2 style="font-family:'Bebas Neue',Impact;font-weight:400;letter-spacing:.06em;font-size:40px;margin:8px 0">${esc(R[t.g].name)}</h2><p style="color:#aaa">${GDESC[t.g]} · ${t.seats.filter(Boolean).length} sentado(s)</p><div class="mx-row" style="margin-top:12px">${t.mine.some(Boolean) ? '' : '<button class="mx-b red" data-a="sitfree">Sentar na mesa</button>'}<button class="mx-b gold" data-a="start">▶ Começar</button></div><div class="mx-seats" style="justify-content:center;margin-top:16px">${t.seats.map((s, i) => s ? `<span class="mx-seat f ${s.npc ? 'npc' : ''}"><i></i>${esc(s.name)}</span>` : `<span class="mx-seat">vago</span>`).join('')}</div></div>`;
}
return ({sinuca: poolHTML, xadrez: chessHTML, uno: unoHTML, truco: trucoHTML, vinteum: bjHTML, trinca: trincaHTML}[t.g])(t, t.st);
}
function statusBar(t, txt) {
const ts = R[t.g].turnSeat(t.st), my = t.mine[ts];
if (t.status === 'end' || t.st.over) { const o = t.st.over; const w = o && o.win >= 0 ? t.seats[o.win] : null; return `<div class="mx-status">${w ? '🏆 ' + esc(w.name) + ' venceu' : '🤝 Empate'}${o && o.why ? ' · ' + esc(o.why) : ''}</div>`; }
return `<div class="mx-status ${my ? 'turn' : ''}">${my ? (t.seats[ts].npc ? 'Vez do NPC ' + esc(t.seats[ts].name) + ' (você joga)' : 'Sua vez') : 'Vez de ' + esc((t.seats[ts] || {}).name || '…')}${txt ? ' · ' + txt : ''}</div>`;
}
async function onGClick(e) {
const b = e.target.closest('[data-a]'); if (!b || !gEl.contains(b)) return;
if (e.type === 'change' && b.tagName !== 'SELECT' && b.tagName !== 'INPUT') return;
if (e.type === 'click' && (b.tagName === 'SELECT')) return;
const a = b.dataset.a, t = GV[gTab];
if (a === 'x') return closeGames();
if (a === 'lobby') { gTab = 'lobby'; return renderGames(); }
if (a === 'open') { gTab = b.dataset.t; return renderGames(); }
if (a === 'new') {
const g = b.dataset.g; let npc = null;
if (isH()) { const r = await promptBox(`Abrir ${R[g].name}`, 'Você quer se sentar como algum NPC? (deixe vazio para só abrir a mesa)', 'Ex.: Lindomar'); if (r === null) return; npc = r.trim(); }
const before = new Set(Object.keys(GV));
send({k: 'g', op: 'new', g, sitGM: !!npc, npc});
waitNew(before); return;
}
if (!t) return;
if (a === 'close') { if (await confirmBox('Fechar essa mesa para todo mundo?')) { send({k: 'g', op: 'close', tid: t.id}); gTab = 'lobby'; } return; }
if (a === 'sit') return send({k: 'g', op: 'sit', tid: t.id, seat: +b.dataset.i});
if (a === 'sitfree') { const i = t.seats.findIndex(x => !x); if (i < 0) return toast('Mesa cheia.'); return send({k: 'g', op: 'sit', tid: t.id, seat: i}); }
if (a === 'npc') { const r = await promptBox('NPC na mesa', 'Nome do NPC (você joga por ele):', 'Ex.: Seu Zé'); if (r && r.trim()) send({k: 'g', op: 'sit', tid: t.id, seat: +b.dataset.i, npc: r.trim()}); return; }
if (a === 'leave') return send({k: 'g', op: 'leave', tid: t.id, seat: +b.dataset.i});
if (a === 'start') return send({k: 'g', op: 'start', tid: t.id});
if (a === 'again') return send({k: 'g', op: 'again', tid: t.id});
gameClick(t, a, b, e);
}
function waitNew(before) { let n = 0; const iv = setInterval(() => { const id = Object.keys(GV).find(k => !before.has(k)); if (id || ++n > 40) { clearInterval(iv); if (id) { gTab = id; renderGames(); } } }, 100); }
function promptBox(title, msg, ph) {
return new Promise(res => {
const host = gEl || document.body, d = document.createElement('div'); d.className = 'mx-modal'; if (!gEl) { d.style.position = 'fixed'; d.style.zIndex = 400; }
d.innerHTML = `<div style="align-items:stretch;width:min(360px,90vw)"><b style="font-size:16px">${esc(title)}</b><div style="font-size:13px;color:#aaa">${esc(msg)}</div><input class="mx-in" placeholder="${esc(ph || '')}" maxlength="24"><div class="mx-row" style="justify-content:flex-end"><button class="mx-b ghost" data-r="0">Cancelar</button><button class="mx-b red" data-r="1">OK</button></div></div>`;
host.appendChild(d); const inp = d.querySelector('input'); setTimeout(() => inp.focus(), 30);
const done = v => { d.remove(); res(v); };
d.addEventListener('click', e => { const r = e.target.closest('[data-r]'); if (r) done(r.dataset.r === '1' ? inp.value : null); else if (e.target === d) done(null); });
inp.addEventListener('keydown', e => { if (e.key === 'Enter') done(inp.value); if (e.key === 'Escape') done(null); });
});
}
function confirmBox(msg) {
return new Promise(res => {
const d = document.createElement('div'); d.className = 'mx-modal'; d.style.position = 'fixed'; d.style.zIndex = 400;
d.innerHTML = `<div><div style="font-size:15px;text-align:center;max-width:300px">${esc(msg)}</div><div class="mx-row"><button class="mx-b ghost" data-r="0">Cancelar</button><button class="mx-b red" data-r="1">Confirmar</button></div></div>`;
document.body.appendChild(d); d.addEventListener('click', e => { const r = e.target.closest('[data-r]'); if (r || e.target === d) { d.remove(); res(!!r && r.dataset.r === '1'); } });
});
}
const FACE = {J: '♝', Q: '♛', K: '♚'};
function card(c, cls = '', attrs = '') {
if (!c || c === '??') return `<div class="mxc back ${cls}" ${attrs}></div>`;
const r = c.slice(0, -1), s = c.slice(-1), red = s === '♥' || s === '♦';
const center = FACE[r] ? `<span>${FACE[r]}</span>` : r === 'A' ? `<span style="font-size:44px">${s}</span>` : s;
return `<div class="mxc ${red ? 'r' : ''} ${FACE[r] ? 'face' : ''} ${cls}" ${attrs}><div class="tl">${r}<small>${s}</small></div><div class="ct">${center}</div><div class="br">${r}<small>${s}</small></div></div>`;
}
const backs = (n, cls = 'sm') => `<div class="mx-fan">${Array.from({length: Math.min(n, 12)}, () => card(null, cls)).join('')}</div>`;
function bjHTML(t, s) {
let h = statusBar(t, s.phase === 'play' ? '' : s.phase === 'end' ? 'Rodada encerrada' : 'Façam suas apostas');
h += `<div class="mx-lbl">Banca ${s.dealer.length ? '· ' + (s.phase === 'play' ? s.dval + ' + ?' : s.dval) : ''}</div><div class="mx-hand">${s.dealer.map(c => card(c)).join('') || '<div style="opacity:.5">—</div>'}</div>`;
h += `<div class="mx-row" style="margin-top:22px;align-items:flex-start">`;
t.seats.forEach((st, i) => {
if (!st) return;
const hand = s.hands && s.hands[i];
h += `<div class="mx-seatbox ${s.phase === 'play' && s.cur === i ? 'cur' : ''}"><div class="mx-nm">${esc(st.name)}</div><span class="mx-chip">${s.chips[i]}</span><div class="mx-hand" style="margin:0">${hand ? hand.map(c => card(c, 'sm')).join('') : '<small style="opacity:.6">fora da rodada</small>'}</div>${hand ? `<b>${s.vals[i]}</b>` : ''}${s.res[i] ? `<small style="color:${/Ganhou|Black/.test(s.res[i]) ? '#7fe0a0' : /Empate/.test(s.res[i]) ? '#ddd' : '#ff8a8a'}">${esc(s.res[i])}</small>` : ''}</div>`;
});
h += `</div><div class="mx-row" style="margin-top:20px">`;
if (s.phase === 'play' && t.mine[s.cur]) h += `<button class="mx-b gold" data-a="bj" data-o="hit">Pedir carta</button><button class="mx-b" data-a="bj" data-o="stand">Parar</button>${s.hands[s.cur].length === 2 ? '<button class="mx-b" data-a="bj" data-o="double">Dobrar</button>' : ''}`;
if (s.phase !== 'play' && t.mine.some(Boolean)) h += `<span style="font-size:13px;color:#ddd">Aposta</span><select class="mx-in" style="width:auto" data-a="bjbet">${[5, 10, 20, 50].map(v => `<option ${v === s.bet ? 'selected' : ''}>${v}</option>`).join('')}</select><button class="mx-b red" data-a="bj" data-o="deal">Distribuir cartas</button>`;
return h + '</div>';
}
function trincaHTML(t, s) {
const me = t.per, my = me >= 0 && Array.isArray(s.hands[me]) ? s.hands[me] : null, myTurn = t.mine[s.cur] && !s.over;
let h = statusBar(t, s.over ? '' : myTurn ? (s.drew ? 'descarte uma carta (ou bata)' : 'compre do monte ou do lixo') : '');
h += `<div class="mx-row" style="gap:22px;margin:6px 0 10px">`;
t.seats.forEach((st, i) => { if (!st || i === me || !s.hands[i]) return; h += `<div class="mx-seatbox ${s.cur === i ? 'cur' : ''}"><div class="mx-nm">${esc(st.name)}</div>${Array.isArray(s.hands[i]) ? `<div class="mx-hand" style="margin:0">${s.hands[i].map(c => card(c, 'sm')).join('')}</div>` : backs(s.hands[i])}</div>`; });
h += `</div><div class="mx-row" style="gap:26px"><div style="text-align:center"><div class="mx-lbl">Monte · ${s.deckN}</div><div ${myTurn && !s.drew ? 'data-a="tr-draw" data-f="deck" style="cursor:pointer"' : ''}>${card(null, myTurn && !s.drew ? 'pick' : '')}</div></div><div style="text-align:center"><div class="mx-lbl">Lixo</div><div ${myTurn && !s.drew && s.top ? 'data-a="tr-draw" data-f="disc" style="cursor:pointer"' : ''}>${s.top ? card(s.top, myTurn && !s.drew ? 'pick' : '') : '<div class="mxc" style="opacity:.15"></div>'}</div></div></div>`;
if (s.over && s.over.groups) h += `<div class="mx-lbl" style="margin-top:14px">Jogos de ${esc(t.seats[s.over.win].name)}</div><div class="mx-row">${s.over.groups.map(g => `<div class="mx-hand" style="margin:0;padding:6px;background:rgba(0,0,0,.25);border-radius:10px">${g.map(c => card(c, 'sm')).join('')}</div>`).join('')}</div>`;
if (my) {
const sk = sel[t.id];
h += `<div class="mx-lbl" style="margin-top:16px">Sua mão ${my.length} cartas</div><div class="mx-hand">${my.map(c => card(c, 'pick ' + (sk === c ? 'sel' : ''), `data-a="tr-sel" data-c="${c}"`)).join('')}</div><div class="mx-row" style="margin-top:12px"><button class="mx-b ghost" data-a="tr-sort" data-o="s">Ordenar por naipe</button><button class="mx-b ghost" data-a="tr-sort" data-o="r">Ordenar por valor</button>${myTurn && s.drew ? `<button class="mx-b" data-a="tr-disc" ${sk ? '' : 'disabled'}>Descartar</button><button class="mx-b gold" data-a="tr-bater" ${sk ? '' : 'disabled'}>Bater!</button>` : ''}</div><div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:8px;text-align:center">Bata com 3 jogos de 3: trinca (mesmo valor, naipes diferentes) ou sequência do mesmo naipe. Selecione a carta que vai para o lixo.</div>`;
}
return h;
}
const RK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
function trucoHTML(t, s) {
const me = t.per >= 0 ? t.per : 0, op = 1 - me, my = Array.isArray(s.hands[me]) ? s.hands[me] : null;
const myTurn = t.mine[R.truco.turnSeat(s)] && !s.over;
const vz = s.vazas.map(w => `<i class="${w === -1 ? 't' : w === me ? 'w' : 'l'}"></i>`).join('') + '<i></i>'.repeat(3 - s.vazas.length);
let h = `<div class="mx-row" style="justify-content:space-between;width:100%;max-width:760px"><div class="mx-score">${esc((t.seats[me] || {}).name || 'A')} <b style="color:#d8a74a">${s.pts[me]}</b> × <b style="color:#d8a74a">${s.pts[op]}</b> ${esc((t.seats[op] || {}).name || 'B')}<span>até 12</span></div><div class="mx-vz">${vz}</div><span class="mx-chip">vale ${s.bet}</span></div>`;
h += statusBar(t, s.msg ? esc(s.msg) : '');
h += `<div class="mx-row" style="margin-bottom:10px">${Array.isArray(s.hands[op]) ? s.hands[op].map(c => card(c, 'sm')).join('') : backs(s.hands[op])}</div>`;
const showPrev = !s.table.length && s.prev && s.vazas.length;
const tb = s.table.length ? s.table : showPrev ? s.prev : [];
h += `<div class="mx-row" style="gap:40px;min-height:120px"><div style="text-align:center"><div class="mx-lbl">Vira</div>${card(s.vira)}<div style="font-size:12px;margin-top:6px;color:#d8a74a">manilha: <b>${s.man}</b></div></div><div class="mx-row" style="gap:14px;${showPrev ? 'opacity:.55' : ''}">${showPrev ? '<div class="mx-lbl" style="width:100%;text-align:center">última vaza</div>' : ''}${tb.map(x => `<div style="text-align:center"><div class="mx-lbl">${esc((t.seats[x.seat] || {}).name || '')}</div>${x.down ? card(null) : card(x.c, x.c.slice(0, -1) === s.man ? 'mani' : '')}</div>`).join('') || '<div style="opacity:.4;font-size:13px">mesa vazia</div>'}</div></div>`;
if (s.ask) h += `<div style="margin:12px 0" class="mx-ask">${s.NAMES[s.ask.to]}!</div>`;
if (my) {
h += `<div class="mx-hand" style="margin-top:14px">${my.map(c => card(c, (myTurn && !s.ask ? 'pick ' : '') + (c.slice(0, -1) === s.man ? 'mani' : ''), myTurn && !s.ask ? `data-a="tc-play" data-c="${c}"` : '')).join('')}</div>`;
h += `<div class="mx-row" style="margin-top:12px">`;
const canRaise = s.pts[0] !== 11 && s.pts[1] !== 11;
if (s.ask && t.mine[1 - s.ask.by]) h += `<button class="mx-b grn" data-a="tc" data-o="accept">Aceito</button><button class="mx-b" data-a="tc" data-o="run">Corro</button>${s.ask.to < 12 && canRaise ? `<button class="mx-b red" data-a="tc" data-o="raise">${s.NAMES[{3: 6, 6: 9, 9: 12}[s.ask.to]]}!</button>` : ''}`;
else if (myTurn && !s.ask) { if (s.next && canRaise && s.lastRaiser !== me) h += `<button class="mx-b red" data-a="tc" data-o="raise">${s.NAMES[s.next]}!</button>`; if (s.vazas.length) h += `<label style="font-size:12px;display:flex;gap:6px;align-items:center"><input type="checkbox" data-a="tc-down" ${sel[t.id + 'd'] ? 'checked' : ''}> jogar encoberta</label>`; h += `<button class="mx-b ghost" data-a="tc" data-o="fold">Correr da mão</button>`; }
h += `</div>`;
}
return h;
}
const UNO_LBL = {S: '⊘', R: '⇄', D: '+2', W: '✱', F: '+4'};
function uno(c, cls = '', attrs = '') {
if (!c) return `<div class="mxu back ${cls}" ${attrs}><b>UNO</b></div>`;
const col = c[0], k = c[1], lbl = UNO_LBL[k] || k;
return `<div class="mxu ${col} ${cls}" ${attrs}><i>${lbl}</i><b>${lbl}</b></div>`;
}
function unoHTML(t, s) {
const me = t.per, my = me >= 0 && Array.isArray(s.hands[me]) ? s.hands[me] : null, myTurn = t.mine[s.cur] && !s.over;
const cname = {r: 'vermelho', y: 'amarelo', g: 'verde', b: 'azul'}[s.color];
let h = statusBar(t, (s.msg ? esc(s.msg) + ' · ' : '') + 'cor: ' + cname);
h += `<div class="mx-row" style="gap:16px;margin-bottom:8px">`;
t.seats.forEach((st, i) => { if (!st || i === me || s.hands[i] == null) return; const n = Array.isArray(s.hands[i]) ? s.hands[i].length : s.hands[i]; h += `<div class="mx-seatbox ${s.cur === i ? 'cur' : ''}" style="min-width:110px"><div class="mx-nm">${esc(st.name)}</div><div class="mx-fan">${Array.from({length: Math.min(n, 8)}, () => uno(null, 'sm')).join('')}</div><small>${n} carta${n > 1 ? 's' : ''}${n === 1 ? ' · <b style="color:#ff6b6b">UNO</b>' : ''}</small></div>`; });
h += `</div><div class="mx-row" style="gap:30px;margin:10px 0"><div style="text-align:center"><div class="mx-lbl">Monte ${s.deckN}</div>${uno(null, myTurn && !s.drew ? 'pick' : '', myTurn && !s.drew ? 'data-a="u-draw"' : '')}</div><div style="text-align:center"><div class="mx-lbl">Mesa ${s.dir > 0 ? '↻' : '↺'}</div><div style="box-shadow:0 0 0 4px ${({r: '#d72600', y: '#ecd407', g: '#379711', b: '#0956bf'})[s.color]};border-radius:12px">${uno(s.top.length > 2 ? s.top.slice(0, 2) : s.top)}</div></div></div>`;
if (my) {
const top = s.top.length > 2 ? s.top.slice(0, 2) : s.top;
h += `<div class="mx-hand" style="gap:4px;max-width:900px">${my.map((c, i) => { const ok = myTurn && R.uno.playable(c, top, s.color) && (!s.drew || i === my.length - 1); return uno(c, myTurn ? (ok ? 'pick' : 'no') : '', ok ? `data-a="u-play" data-c="${c}"` : ''); }).join('')}</div><div class="mx-row" style="margin-top:12px">${myTurn && s.drew ? '<button class="mx-b" data-a="u-pass">Passar</button>' : ''}${my.length <= 2 && !s.over ? '<button class="mx-b red" data-a="u-uno" style="font-family:Arial Black">UNO!</button>' : ''}</div>`;
}
return h;
}
function colorPick() {
return new Promise(res => { const d = document.createElement('div'); d.className = 'mx-modal'; d.innerHTML = `<div><b>Escolha a cor</b><div class="mx-colpick">${['r', 'y', 'g', 'b'].map(c => `<button data-c="${c}" style="background:${({r: '#d72600', y: '#ecd407', g: '#379711', b: '#0956bf'})[c]}"></button>`).join('')}</div></div>`; gEl.querySelector('.mx-stage').appendChild(d); d.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b || e.target === d) { d.remove(); res(b ? b.dataset.c : null); } }); });
}
const PCS = {k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'};
function chessHTML(t, s) {
const flip = t.per === 1, me = t.per, myTurn = me >= 0 && t.mine[R.xadrez.turnSeat(s)];
const selSq = sel[t.id], legal = myTurn && selSq != null ? R.xadrez.legal(s).filter(m => m.f === selSq) : [];
const kSq = s.st === 'xeque' || s.st === 'mate' ? s.b.indexOf(s.turn === 'w' ? 'K' : 'k') : -1;
const st = s.st === 'xeque' ? 'XEQUE!' : '';
const capLine = side => s.cap[side].split('').map(p => PCS[p.toLowerCase()]).join('');
let h = `<div class="mx-row" style="justify-content:space-between;width:min(580px,90vw)"><span class="mx-nm">${esc((t.seats[flip ? 0 : 1] || {}).name || '')} ${flip ? '♔' : '♚'}</span><span class="mx-cap" style="color:${flip ? '#151515;-webkit-text-stroke:1px #888' : '#fff'}">${capLine(flip ? 'w' : 'b')}</span></div>`;
h += statusBar(t, st);
h += '<div class="mx-board">';
for (let vi = 0; vi < 64; vi++) {
const sq = flip ? 63 - vi : vi, r = sq >> 3, c = sq & 7, p = s.b[sq];
const cls = ((r + c) % 2 ? 'd' : 'l') + (s.last && s.last.includes(sq) ? ' last' : '') + (selSq === sq ? ' sel' : '') + (sq === kSq ? ' chk' : '');
const lg = legal.find(m => m.t === sq);
h += `<div class="mx-sq ${cls}" data-a="cs" data-q="${sq}">${(flip ? c === 7 : c === 0) ? `<span class="cd">${8 - r}</span>` : ''}${p !== '.' ? `<span class="mx-pc ${R.xadrez.isW(p) ? 'w' : 'b'}">${PCS[p.toLowerCase()]}</span>` : ''}${lg ? (p !== '.' ? '<span class="ring"></span>' : '<span class="dot"></span>') : ''}${(flip ? r === 0 : r === 7) ? `<span class="cd" style="left:auto;right:3px;top:auto;bottom:1px">${'abcdefgh'[c]}</span>` : ''}</div>`;
}
h += `</div><div class="mx-row" style="justify-content:space-between;width:min(580px,90vw);margin-top:8px"><span class="mx-nm">${esc((t.seats[flip ? 1 : 0] || {}).name || '')} ${flip ? '♚' : '♔'}</span><span class="mx-cap">${capLine(flip ? 'b' : 'w')}</span></div>`;
if (me >= 0 && !s.over) h += `<div class="mx-row" style="margin-top:8px"><button class="mx-b ghost" data-a="cs-resign">Desistir</button></div>`;
return h;
}
const BALLC = ['#f5f1e6', '#f2c200', '#1f4fb8', '#d0261c', '#5b2a86', '#f07a12', '#1f7a3a', '#7a1a20', '#111', '#f2c200', '#1f4fb8', '#d0261c', '#5b2a86', '#f07a12', '#1f7a3a', '#7a1a20'];
function poolHTML(t, s) {
const me = t.per, myG = me >= 0 ? s.groups[me] : null;
const gi = g => g ? (g === 'lisas' ? 'Lisas (1–7)' : 'Listradas (9–15)') : 'indefinido';
const left = g => s.balls.filter(b => !b.in && b.n && b.n !== 8 && R.sinuca.grp(b.n) === g).map(b => `<i style="background:${b.n > 8 ? `linear-gradient(#fff 30%,${BALLC[b.n]} 30% 70%,#fff 70%)` : BALLC[b.n]}">${b.n}</i>`).join('');
let h = `<div class="mx-row" style="justify-content:space-between;width:min(100%,980px);margin-bottom:6px">${t.seats.slice(0, 2).map((st, i) => `<div class="mx-seatbox ${s.cur === i ? 'cur' : ''}" style="flex-direction:row;padding:8px 12px"><b class="mx-nm">${esc(st ? st.name : '')}</b><small style="opacity:.7">${gi(s.groups[i])}</small><span class="mx-balls">${s.groups[i] ? left(s.groups[i]) : ''}</span></div>`).join('')}</div>`;
h += statusBar(t, esc(s.msg || '') + (t.mine[s.cur] && s.inHand ? ' · clique na mesa para posicionar a branca' : ''));
h += `<canvas class="mx-pool" id="mxPool" width="1080" height="580"></canvas><div class="mx-row" style="margin-top:10px"><div class="mx-power"><b id="mxPow" style="width:0%"></b></div><span style="font-size:12px;color:#aaa">${t.mine[s.cur] && !s.over ? 'Arraste para trás a partir da branca e solte para tacar' : ''}</span></div>`;
return h;
}
let pool = null; // {t, anim, aim}
function stopPool() { if (pool && pool.raf) cancelAnimationFrame(pool.raf); pool = null; }
const PM = 40; // margem (tabela)
function drawPool(cv, balls, aim) {
const g = cv.getContext('2d'), W = R.sinuca.W, Hh = R.sinuca.H, BR = R.sinuca.BR;
g.clearRect(0, 0, cv.width, cv.height);
const wood = g.createLinearGradient(0, 0, 0, cv.height); wood.addColorStop(0, '#5a3418'); wood.addColorStop(1, '#3a200e');
g.fillStyle = wood; rr(g, 0, 0, cv.width, cv.height, 26); g.fill();
g.fillStyle = '#0e5a35'; g.fillRect(PM - 10, PM - 10, W + 20, Hh + 20);
const felt = g.createRadialGradient(PM + W / 2, PM + Hh / 2, 60, PM + W / 2, PM + Hh / 2, W * .6); felt.addColorStop(0, '#1f8a55'); felt.addColorStop(1, '#126b3f');
g.fillStyle = felt; g.fillRect(PM, PM, W, Hh);
g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(PM + 250, PM); g.lineTo(PM + 250, PM + Hh); g.stroke();
g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(PM + 700, PM + Hh / 2, 3, 0, 7); g.fill();
g.fillStyle = '#e8d6a6'; for (let k = 1; k < 8; k++) { if (k === 4) continue; dia(g, PM + W * k / 8, PM / 2 - 2); dia(g, PM + W * k / 8, cv.height - PM / 2 + 2); } for (let k = 1; k < 4; k++) { dia(g, PM / 2 - 2, PM + Hh * k / 4); dia(g, cv.width - PM / 2 + 2, PM + Hh * k / 4); }
R.sinuca.POCKETS.forEach(([x, y]) => { g.fillStyle = '#050505'; g.beginPath(); g.arc(PM + x, PM + y, 24, 0, 7); g.fill(); });
if (aim) {
const c = balls.find(b => b.n === 0);
g.save(); g.setLineDash([6, 8]); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2;
g.beginPath(); g.moveTo(PM + c.x, PM + c.y); g.lineTo(PM + c.x + aim.dx * 700, PM + c.y + aim.dy * 700); g.stroke(); g.restore();
const back = 20 + aim.p * 4;
g.strokeStyle = '#c99a5b'; g.lineWidth = 7; g.lineCap = 'round';
g.beginPath(); g.moveTo(PM + c.x - aim.dx * (BR + back), PM + c.y - aim.dy * (BR + back)); g.lineTo(PM + c.x - aim.dx * (BR + back + 380), PM + c.y - aim.dy * (BR + back + 380)); g.stroke();
g.strokeStyle = '#2a6fb5'; g.lineWidth = 7; g.beginPath(); g.moveTo(PM + c.x - aim.dx * (BR + back), PM + c.y - aim.dy * (BR + back)); g.lineTo(PM + c.x - aim.dx * (BR + back + 10), PM + c.y - aim.dy * (BR + back + 10)); g.stroke();
}
balls.forEach(b => {
if (b.in) return; const x = PM + b.x, y = PM + b.y;
g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x + 3, y + 4, BR, 0, 7); g.fill();
g.save(); g.beginPath(); g.arc(x, y, BR, 0, 7); g.clip();
g.fillStyle = b.n > 8 ? '#f5f1e6' : BALLC[b.n]; g.fillRect(x - BR, y - BR, BR * 2, BR * 2);
if (b.n > 8) { g.fillStyle = BALLC[b.n]; g.fillRect(x - BR, y - BR * .55, BR * 2, BR * 1.1); }
const sh = g.createRadialGradient(x - 4, y - 5, 1, x, y, BR * 1.2); sh.addColorStop(0, 'rgba(255,255,255,.75)'); sh.addColorStop(.25, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.35)');
g.fillStyle = sh; g.fillRect(x - BR, y - BR, BR * 2, BR * 2); g.restore();
if (b.n) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = 'bold 8px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b.n, x, y + .5); }
});
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function dia(g, x, y) { g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + 3, y); g.lineTo(x, y + 4); g.lineTo(x - 3, y); g.closePath(); g.fill(); }
const animated = {};
function afterTable(t) {
if (t.g !== 'sinuca' || !t.st || t.status === 'lobby') { stopPool(); return; }
const cv = document.getElementById('mxPool'); if (!cv) return;
const s = t.st;
if (pool && pool.raf) cancelAnimationFrame(pool.raf);
pool = {t, cv, aim: null};
const sh = s.shot;
if (sh && animated[t.id] !== sh.n) {
animated[t.id] = sh.n;
const frames = []; R.sinuca.simulate(sh.start, sh.vx, sh.vy, b => frames.push(b.map(x => ({n: x.n, x: x.x, y: x.y, in: x.in}))));
let i = 0; beep(180, .05, 'triangle');
const step = () => { if (!pool || pool.cv !== cv) return; if (i < frames.length) { drawPool(cv, frames[i]); i += 2; pool.raf = requestAnimationFrame(step); } else { pool.raf = 0; drawPool(cv, s.balls); } };
step();
} else drawPool(cv, s.balls);
const toTable = e => { const r = cv.getBoundingClientRect(); return {x: (e.clientX - r.left) * cv.width / r.width - PM, y: (e.clientY - r.top) * cv.height / r.height - PM}; };
let drag = null;
cv.onpointerdown = e => {
if (!t.mine[s.cur] || s.over || (pool && pool.raf)) return;
const p = toTable(e);
if (s.inHand) { gAct(t, {op: 'place', x: p.x, y: p.y}); setTimeout(() => {}, 0); s.inHand = false; return; }
drag = p; cv.setPointerCapture(e.pointerId);
};
cv.onpointermove = e => {
if (!t.mine[s.cur] || s.over || (pool && pool.raf)) return;
const c = s.balls.find(b => b.n === 0), p = toTable(e);
let dx, dy, pw = 0;
if (drag) { dx = drag.x - p.x; dy = drag.y - p.y; const d = Math.hypot(dx, dy); pw = Math.min(40, d / 7); if (d < 2) { dx = p.x - c.x; dy = p.y - c.y; } }
else { dx = p.x - c.x; dy = p.y - c.y; }
const L = Math.hypot(dx, dy) || 1; pool.aim = {dx: dx / L, dy: dy / L, p: pw};
const pb = document.getElementById('mxPow'); if (pb) pb.style.width = (pw / 40 * 100) + '%';
drawPool(cv, s.balls, pool.aim);
};
cv.onpointerup = e => {
if (!drag) return; drag = null;
const a = pool && pool.aim; if (!a || a.p < 1) return;
const sp = Math.round(a.p * 100) / 100;
gAct(t, {op: 'shoot', vx: Math.round(a.dx * sp * 1000) / 1000, vy: Math.round(a.dy * sp * 1000) / 1000});
pool.aim = null;
};
}
async function gameClick(t, a, b, e) {
const s = t.st; if (!s) return;
switch (a) {
case 'bj': return gAct(t, {op: b.dataset.o});
case 'bjbet': return gAct(t, {op: 'bet', v: +b.value});
case 'tr-draw': return gAct(t, {op: 'draw', from: b.dataset.f});
case 'tr-sel': sel[t.id] = sel[t.id] === b.dataset.c ? null : b.dataset.c; return renderGames();
case 'tr-disc': if (sel[t.id]) { gAct(t, {op: 'discard', c: sel[t.id]}); sel[t.id] = null; } return;
case 'tr-bater': if (sel[t.id]) { gAct(t, {op: 'bater', c: sel[t.id]}); sel[t.id] = null; } return;
case 'tr-sort': {
const h = s.hands[t.per]; if (!Array.isArray(h)) return;
const ord = b.dataset.o === 's' ? h.slice().sort((x, y) => x.slice(-1).localeCompare(y.slice(-1)) || RK.indexOf(x.slice(0, -1)) - RK.indexOf(y.slice(0, -1))) : h.slice().sort((x, y) => RK.indexOf(x.slice(0, -1)) - RK.indexOf(y.slice(0, -1)) || x.slice(-1).localeCompare(y.slice(-1)));
if (t.mine[s.cur]) gAct(t, {op: 'sort', order: ord}); else { s.hands[t.per] = ord; renderGames(); }
return;
}
case 'tc': return gAct(t, {op: b.dataset.o});
case 'tc-down': sel[t.id + 'd'] = b.checked; return;
case 'tc-play': { const down = !!sel[t.id + 'd']; sel[t.id + 'd'] = false; return gAct(t, {op: 'play', c: b.dataset.c, down}); }
case 'u-draw': return gAct(t, {op: 'draw'});
case 'u-pass': return gAct(t, {op: 'pass'});
case 'u-uno': return gAct(t, {op: 'uno'});
case 'u-play': { const c = b.dataset.c; let col = null; if (c[0] === 'w') { col = await colorPick(); if (!col) return; } const h = s.hands[t.per]; return gAct(t, {op: 'play', c, col, uno: Array.isArray(h) && h.length === 2 && !!s.uno[t.per]}); }
case 'cs-resign': if (await confirmBox('Desistir da partida?')) gAct(t, {op: 'resign'}); return;
case 'cs': {
const q = +b.dataset.q, me = t.per; if (me < 0 || !t.mine[R.xadrez.turnSeat(s)]) return;
const side = me === 0 ? 'w' : 'b', p = s.b[q];
if (sel[t.id] != null) {
const mv = R.xadrez.legal(s).find(m => m.f === sel[t.id] && m.t === q);
if (mv) { let pr = 'q'; if (mv.pr) { pr = await promoPick(side); if (!pr) return; } sel[t.id] = null; return gAct(t, {op: 'move', f: mv.f, t: mv.t, pr}); }
}
sel[t.id] = p !== '.' && R.xadrez.col(p) === side ? q : null; return renderGames();
}
}
}
function promoPick(side) {
return new Promise(res => { const d = document.createElement('div'); d.className = 'mx-modal'; d.innerHTML = `<div><b>Promover para</b><div class="mx-row">${['q', 'r', 'b', 'n'].map(p => `<button class="mx-b" data-p="${p}" style="font-size:34px;padding:6px 14px"><span class="mx-pc ${side}">${PCS[p]}</span></button>`).join('')}</div></div>`; gEl.querySelector('.mx-stage').appendChild(d); d.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b || e.target === d) { d.remove(); res(b ? b.dataset.p : null); } }); });
}
let pOpen = false, pEl = null, scr = 'home', gmAs = '', spyKey = '', pDraft = {}, igSel = null, newGrp = null;
const WALLS = ['linear-gradient(160deg,#1d2b64,#7a1a20)', 'linear-gradient(160deg,#0f2027,#2c5364)', 'linear-gradient(160deg,#3a1c71,#d76d77,#ffaf7b)', 'linear-gradient(160deg,#111,#3a0a0e)', 'linear-gradient(160deg,#134e5e,#71b280)', 'radial-gradient(circle at 30% 20%,#c3161f,#140507 70%)'];
function openPhone() { ensureCSS(); pOpen = true; if (!isH() && !PV) B().toHost({k: 'hello'}); renderPhone(); renderDockBadges(); }
function closePhone() { pOpen = false; if (pEl) pEl.remove(); pEl = null; spyKey = ''; renderDockBadges(); }
const hhmm = ts => { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const dayLbl = ts => { const d = new Date(ts), n = new Date(); return d.toDateString() === n.toDateString() ? hhmm(ts) : d.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}); };
function view() {
if (!PV) return null;
if (PV.gm && spyKey) { hostInit(); return phoneView(spyKey); }
return PV;
}
const meIdOf = v => v.gm ? gmAs : (v.me && v.me.id);
function nameOf(v, id) { if (!id) return '?'; if (!v.gm && v.alias && v.alias[id]) return v.alias[id]; const x = v.ids[id]; return x ? x.name : 'Desconhecido'; }
function avHTML(v, id, cls = '') { const x = v.ids[id] || {}; const nm = nameOf(v, id); return `<div class="mxp-av ${cls}" style="background:${x.av ? `url(${x.av}) center/cover` : (x.color || '#555')}">${x.av ? '' : esc((nm[0] || '?').toUpperCase())}</div>`; }
function chatsFor(v) {
const me = meIdOf(v);
let cs = v.chats || [];
if (v.gm) cs = cs.filter(c => me ? c.mem.includes(me) : c.mem.some(x => (v.ids[x] || {}).npc));
return cs.slice().sort((a, b) => (b.last || 0) - (a.last || 0));
}
function unreadOf(c) {
const v = PV; if (!v) return 0; const me = v.gm ? null : v.me.id;
const rd = (v.read || {})[c.id] || 0;
return c.msgs.filter(m => m.ts > rd && m.f !== me && !m.sys && (!v.gm || (v.ids[m.f] && !v.ids[m.f].npc))).length;
}
function chatTitle(v, c) { if (c.grp) return c.name; const me = meIdOf(v); const o = c.mem.find(x => x !== me) || c.mem[0]; return v.gm && !me ? c.mem.map(x => nameOf(v, x)).join(' ↔ ') : nameOf(v, o); }
function chatOther(v, c) { const me = meIdOf(v); return c.mem.find(x => x !== me) || c.mem[0]; }
function phoneNotify(old, nv) {
if (!nv || !old) return;
const oldIds = new Set(); (old.chats || []).forEach(c => c.msgs.forEach(m => oldIds.add(m.id)));
const me = nv.gm ? null : nv.me && nv.me.id;
let n = 0;
(nv.chats || []).forEach(c => c.msgs.forEach(m => {
if (oldIds.has(m.id) || m.f === me || m.sys) return;
if (nv.gm && !c.mem.some(x => (nv.ids[x] || {}).npc)) return;
if (nv.gm && (!nv.ids[m.f] || nv.ids[m.f].npc)) return;
if (n++ < 2) toast(`📱 ${nameOf(nv, m.f)}${c.grp ? ' @ ' + c.name : ''}: ${m.img && !m.tx ? '📷 Foto' : String(m.tx).slice(0, 60)}`);
}));
if (n) { beep(880, .06); setTimeout(() => beep(1175, .07), 110); }
if (old.has && !nv.has) toast('📵 O Mestre pegou o seu celular.');
if (!old.has && nv.has) toast('📱 Seu celular voltou.');
if (old.sig && !nv.sig) toast('📶 Seu celular ficou sem sinal.');
if (!old.sig && nv.sig) toast('📶 O sinal voltou.');
}
function pSend(m) { if (spyKey) return toast('Você está só olhando esse celular.'); send(Object.assign({k: 'p'}, m, PV && PV.gm ? {as: gmAs} : {})); }
function compress(file) {
return new Promise((res, rej) => {
const img = new Image(), url = URL.createObjectURL(file);
img.onload = () => { const m = 560, k = Math.min(1, m / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .72)); };
img.onerror = rej; img.src = url;
});
}
function pickImage() { return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async () => { const f = i.files && i.files[0]; if (!f) return res(null); try { res(await compress(f)); } catch (e) { res(null); } }; i.click(); }); }
function renderPhone() {
if (!pOpen) return;
if (!pEl) {
pEl = document.createElement('div'); pEl.className = 'mxp-wrap'; document.body.appendChild(pEl);
pEl.addEventListener('click', onPClick); pEl.addEventListener('change', onPClick);
pEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && e.target.matches('[data-enter]')) { e.preventDefault(); const b = pEl.querySelector('[data-a="' + e.target.dataset.enter + '"]'); if (b) b.click(); } });
pEl.addEventListener('input', e => { if (e.target.dataset.k) pDraft[e.target.dataset.k] = e.target.value; });
}
const v = view();
const keepList = pEl.querySelector('.mxp-chat'); const atBottom = !keepList || keepList.scrollHeight - keepList.scrollTop - keepList.clientHeight < 80;
const keepScroll = pEl.querySelector('.mxp-list') ? pEl.querySelector('.mxp-list').scrollTop : 0;
const focusK = document.activeElement && pEl.contains(document.activeElement) ? document.activeElement.dataset.k : null;
let body;
if (!v) body = `<div class="mxp-off"><div><b>📱</b>Conectando ao celular…</div></div>`;
else if (!v.gm && !v.has) body = `<div class="mxp-off" style="background:#000"><div><b>📵</b>Você está sem o celular.<br><small style="opacity:.6">O Mestre está com ele.</small></div></div>`;
else body = screenHTML(v);
const sig = v && (v.gm || v.sig);
const wall = v ? WALLS[(v.wall || 0) % WALLS.length] : WALLS[0];
pEl.innerHTML = `${spyKey ? `<div class="mxp-spy">👁 Olhando o celular de ${esc(spyKey)} · <a style="color:#fff;cursor:pointer;text-decoration:underline" data-a="spyoff">voltar ao seu</a></div>` : ''}<div class="mxp"><button class="mxp-x" data-a="close" title="Guardar o celular">✕</button><div class="mxp-scr" style="background:${scr === 'home' ? wall : '#000'}"><div class="mxp-notch"></div><div class="mxp-sb"><span>${hhmm(Date.now())}</span><span style="display:flex;gap:6px;align-items:center">${sig ? '<span class="sig"><i style="height:4px"></i><i style="height:6px"></i><i style="height:8px"></i><i style="height:11px"></i></span>' : '<span style="font-size:11px">Sem serviço</span>'}${sig ? '<span style="font-size:11px">4G</span>' : ''}<span class="bat"><b style="width:78%"></b></span></span></div>${body}<div class="mxp-ind" data-a="home"></div></div></div>`;
const ch = pEl.querySelector('.mxp-chat'); if (ch && atBottom) ch.scrollTop = ch.scrollHeight;
const ls = pEl.querySelector('.mxp-list'); if (ls) ls.scrollTop = keepScroll;
if (scr.startsWith('chat:') && !spyKey) { const c = (v && v.chats || []).find(x => x.id === scr.slice(5)); if (c && unreadOf(c)) markRead(c.id); }
if (focusK) { const f = pEl.querySelector(`[data-k="${focusK}"]`); if (f) { f.focus(); try { f.setSelectionRange(f.value.length, f.value.length); } catch (e) {} } }
}
function gmBar(v) {
if (!v.gm || spyKey) return '';
const npcs = Object.values(v.ids).filter(x => x.npc).sort((a, b) => a.id === 'ordem' ? -1 : b.id === 'ordem' ? 1 : a.name.localeCompare(b.name));
return `<div class="mxp-gm">Falando como <select data-a="as"><option value="">— todas as conversas de NPC —</option>${npcs.map(x => `<option value="${x.id}" ${x.id === gmAs ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>`;
}
function screenHTML(v) {
const [s, arg] = scr.split(':');
const offBan = !v.gm && !v.sig ? '<div class="mxp-ban">📶 Sem sinal · suas mensagens ficam na fila até o sinal voltar</div>' : '';
if (s === 'home') {
const u = chatsFor(v).reduce((n, c) => n + unreadOf(c), 0);
const d = new Date();
const apps = [['zap', '#25d366', '<svg viewBox="0 0 24 24" width="32" height="32" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>', 'WhatsApp', u],
['insta', 'linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)', '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#fff"/></svg>', 'Instagram', 0],
['contacts', 'linear-gradient(180deg,#9e9ea3,#6d6d72)', '👤', 'Contatos', 0],
['set', 'linear-gradient(180deg,#8e8e93,#48484a)', '⚙️', 'Ajustes', 0]];
if (v.gm && !spyKey) apps.push(['ctrl', 'linear-gradient(180deg,#c3161f,#5c0a10)', '🛡️', 'Controle', 0]);
return `<div class="mxp-home" style="background:${WALLS[(v.wall || 0) % WALLS.length]}"><div class="mxp-clock">${hhmm(Date.now())}</div><div class="mxp-date">${d.toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'})}</div>${v.gm && !spyKey ? '<div style="text-align:center;margin-top:10px;font-size:12px;opacity:.8">Celular do Mestre</div>' : ''}<div class="mxp-apps">${apps.map(([k, bg, ic, nm, bd]) => `<div class="mxp-app" data-a="go" data-s="${k}"><div class="ai" style="background:${bg}">${ic}</div>${nm}${bd ? `<span class="bd">${bd}</span>` : ''}</div>`).join('')}</div></div>`;
}
if (s === 'zap') {
const cs = chatsFor(v);
return `<div class="mxp-ap"><div class="mxp-top"><span class="bk" data-a="go" data-s="home">‹</span><b>WhatsApp</b></div>${gmBar(v)}${offBan}<div class="mxp-list">${cs.map(c => { const last = c.msgs[c.msgs.length - 1]; const u = unreadOf(c); const o = chatOther(v, c); return `<div class="mxp-it" data-a="go" data-s="chat:${c.id}">${c.grp ? `<div class="mxp-av" style="background:#2a3942">👥</div>` : avHTML(v, o)}<div class="tx"><b>${esc(chatTitle(v, c))}</b><small>${last ? (last.sys ? esc(nameOf(v, last.f) + ' ' + last.sys) : (last.f === meIdOf(v) ? (last.q ? '🕓 ' : '✓✓ ') : c.grp ? esc(nameOf(v, last.f)) + ': ' : '') + (last.img && !last.tx ? '📷 Foto' : esc(last.tx))) : 'Toque para conversar'}</small></div><div class="tm">${last ? dayLbl(last.ts) : ''}${u ? `<br><span class="n">${u}</span>` : ''}</div></div>`; }).join('') || '<div style="padding:30px;text-align:center;color:#8696a0;font-size:14px">Nenhuma conversa ainda.<br>Toque em ✎ para começar.</div>'}</div>${!v.gm || gmAs ? '<div class="mxp-fab" data-a="go" data-s="new">✎</div>' : ''}</div>`;
}
if (s === 'new') {
const me = meIdOf(v);
const list = v.gm ? Object.values(v.ids).filter(x => x.id !== me) : v.contacts.map(id => v.ids[id]).filter(Boolean);
return `<div class="mxp-ap"><div class="mxp-top"><span class="bk" data-a="go" data-s="zap">‹</span><b>Nova conversa</b></div><div class="mxp-list"><div class="mxp-it" data-a="go" data-s="grp"><div class="mxp-av" style="background:#00a884">👥</div><div class="tx"><b>Novo grupo</b></div></div>${v.gm ? '' : '<div class="mxp-it" data-a="go" data-s="addc"><div class="mxp-av" style="background:#00a884">＋</div><div class="tx"><b>Novo contato</b></div></div>'}<div style="padding:8px 14px;font-size:12px;color:#8696a0">CONTATOS</div>${list.map(x => `<div class="mxp-it" data-a="dm" data-id="${x.id}">${avHTML(v, x.id)}<div class="tx"><b>${esc(nameOf(v, x.id))}</b><small>${esc(x.bio || x.num || '')}</small></div></div>`).join('')}</div></div>`;
}
if (s === 'grp') {
const me = meIdOf(v); newGrp = newGrp || {name: '', mem: []};
const list = v.gm ? Object.values(v.ids).filter(x => x.id !== me) : v.contacts.map(id => v.ids[id]).filter(Boolean);
return `<div class="mxp-ap"><div class="mxp-top"><span class="bk" data-a="go" data-s="new">‹</span><b>Novo grupo</b></div><div class="mxp-form"><input data-k="gname" placeholder="Nome do grupo" value="${esc(pDraft.gname || '')}" maxlength="30"></div><div class="mxp-list">${list.map(x => `<label class="mxp-chk">${avHTML(v, x.id, 's')}<span style="flex:1">${esc(nameOf(v, x.id))}</span><input type="checkbox" data-a="gmem" data-id="${x.id}" ${newGrp.mem.includes(x.id) ? 'checked' : ''}></label>`).join('')}</div><div class="mxp-form"><button class="mxp-btn" data-a="mkgrp">Criar grupo</button></div></div>`;
}
if (s === 'dm') {
const me = meIdOf(v), c = (v.chats || []).find(c => !c.grp && c.mem.length === 2 && c.mem.includes(me) && c.mem.includes(arg));
if (c) { scr = 'chat:' + c.id; return screenHTML(v); }
return `<div class="mxp-ap"><div class="mxp-top"><span class="bk" data-a="go" data-s="zap">‹</span><b>${esc(nameOf(v, arg))}</b></div><div class="mxp-chat"><div class="mxp-sys">Abrindo conversa…</div></div></div>`;
}
if (s === 'chat') {
const c = (v.chats || []).find(x => x.id === arg); if (!c) { scr = 'zap'; return screenHTML(v); }
const me = meIdOf(v), canType = !spyKey && (!v.gm || (me && c.mem.includes(me)));
const o = chatOther(v, c);
let last = 0;
const msgs = c.msgs.map(m => {
let sep = ''; const dd = new Date(m.ts).toDateString(); if (dd !== last) { last = dd; sep = `<div class="mxp-sys">${new Date(m.ts).toLocaleDateString('pt-BR', {day: 'numeric', month: 'long'})}</div>`; }
if (m.sys) return sep + `<div class="mxp-sys">${esc(nameOf(v, m.f))} ${esc(m.sys)}</div>`;
const mine = m.f === me || (v.gm && !me && false);
const who = c.grp && !mine ? `<div class="who" style="color:${(v.ids[m.f] || {}).color || '#53bdeb'}">${esc(nameOf(v, m.f))}</div>` : (v.gm && !me && !c.grp ? `<div class="who" style="color:${(v.ids[m.f] || {}).color || '#53bdeb'}">${esc(nameOf(v, m.f))}</div>` : '');
return sep + `<div class="mxp-m ${mine ? 'o' : 'i'}">${who}${m.img ? `<img src="${m.img}" alt="">` : m.lost ? '<i style="opacity:.6">📷 foto apagada</i>' : ''}${esc(m.tx)}<span class="mt">${hhmm(m.ts)}${mine ? (m.q ? ' 🕓' : ' <span class="ck">✓✓</span>') : ''}</span></div>`;
}).join('');
const ttl = chatTitle(v, c), sub = c.grp ? c.mem.map(x => nameOf(v, x)).join(', ') : ((v.ids[o] || {}).num || '');
return `<div class="mxp-ap"><div class="mxp-top"><span class="bk" data-a="go" data-s="zap">‹</span>${c.grp ? '<div class="mxp-av s" style="background:#2a3942">👥</div>' : avHTML(v, o, 's')}<div style="flex:1;min-width:0"><b style="display:block;font-size:15px">${esc(ttl)}</b><small style="color:#8696a0;font-size:11.5px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(sub)}</small></div>${v.gm && !spyKey ? `<span data-a="delchat" data-id="${c.id}" title="Apagar conversa" style="cursor:pointer;opacity:.6">🗑</span>` : ''}</div>${offBan}<div class="mxp-chat">${msgs || '<div class="mxp-sys">🔒 As mensagens são protegidas. Ou quase.</div>'}</div>${canType ? `<div class="mxp-in"><button class="g" data-a="img" title="Foto">📷</button><textarea rows="1" data-k="m:${c.id}" data-enter="send" placeholder="Mensagem">${esc(pDraft['m:' + c.id] || '')}</textarea><button data-a="send" data-id="${c.id}">➤</button></div>` : v.gm && !spyKey ? '<div class="mxp-ban" style="background:#1f2c34;color:#8696a0">Escolha lá em cima um NPC dessa conversa para responder.</div>' : ''}</div>`;
}
if (s === 'insta') {
const me = meIdOf(v);
if (!v.gm && !v.sig) return `<div class="mxp-ig"><div class="mxp-igtop"><span class="bk" data-a="go" data-s="home" style="font-size:24px;cursor:pointer">‹</span><span class="lg">Instagram</span></div><div class="mxp-off"><div><b>📶</b>Sem conexão com a internet.</div></div></div>`;
const prof = arg;
let posts = v.posts || [];
let head = '';
if (prof) {
const x = v.ids[prof] || {}; posts = posts.filter(p => p.by === prof);
head = `<div style="display:flex;gap:16px;align-items:center;padding:14px">${avHTML(v, prof)}<div style="flex:1"><b style="font-size:16px">${esc(nameOf(v, prof))}</b>${x.verified ? ' <span style="color:#3897f0">✔</span>' : ''}<div style="font-size:13px;color:#ccc;margin-top:3px">${esc(x.bio || '')}</div><div style="font-size:12px;color:#888;margin-top:4px">${posts.length} publicações</div></div></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px">${posts.map(p => p.img ? `<img src="${p.img}" style="width:100%;aspect-ratio:1;object-fit:cover">` : `<div style="aspect-ratio:1;display:grid;place-items:center;font-size:10px;padding:6px;text-align:center;background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)">${esc(p.tx.slice(0, 50))}</div>`).join('')}</div><div style="padding:10px 14px;font-size:12px;color:#888">PUBLICAÇÕES</div>`;
}
const canPost = !spyKey && (!v.gm || me);
return `<div class="mxp-ig"><div class="mxp-igtop"><span class="bk" data-a="go" data-s="${prof ? 'insta' : 'home'}" style="font-size:24px;cursor:pointer">‹</span><span class="lg">Instagram</span>${canPost ? '<span data-a="go" data-s="newpost" style="font-size:24px;cursor:pointer" title="Publicar">⊕</span>' : ''}${me ? `<span data-a="go" data-s="insta:${me}" style="cursor:pointer">${avHTML(v, me, 'xs')}</span>` : ''}</div>${gmBar(v)}<div class="mxp-list">${head}${posts.map(p => {
const liked = me && p.likes.includes(me);
return `<div class="mxp-post"><div class="mxp-ph" data-a="go" data-s="insta:${p.by}" style="cursor:pointer"><span class="mxp-ring">${avHTML(v, p.by, 'xs')}</span>${esc(nameOf(v, p.by))}${(v.ids[p.by] || {}).verified ? ' <span style="color:#3897f0">✔</span>' : ''}<span style="margin-left:auto;font-weight:400;color:#888;font-size:12px">${dayLbl(p.ts)}</span>${(v.gm && !spyKey) || p.by === me ? `<span data-a="delpost" data-id="${p.id}" style="cursor:pointer;opacity:.5;margin-left:8px">🗑</span>` : ''}</div>${p.img ? `<img class="mxp-pimg" src="${p.img}" data-a="like2" data-id="${p.id}">` : `<div class="mxp-ptx" data-a="like2" data-id="${p.id}">${esc(p.tx)}</div>`}<div class="mxp-pa"><span data-a="like" data-id="${p.id}" style="color:${liked ? '#ff3040' : '#fff'}">${liked ? '♥' : '♡'}</span><span>💬</span></div><div class="mxp-pl"><b>${p.likes.length} curtida${p.likes.length === 1 ? '' : 's'}</b></div>${p.img && p.tx ? `<div class="mxp-pc"><b>${esc(nameOf(v, p.by))}</b> ${esc(p.tx)}</div>` : ''}${p.com.map(c => `<div class="mxp-pc"><b>${esc(nameOf(v, c.by))}</b> ${esc(c.tx)}</div>`).join('')}${me && !spyKey ? `<div class="mxp-pci"><input data-k="c:${p.id}" data-enter="com" placeholder="Adicione um comentário…" value="${esc(pDraft['c:' + p.id] || '')}"><span data-a="com" data-id="${p.id}" style="color:#3897f0;font-weight:600;cursor:pointer;font-size:13px">Publicar</span></div>` : ''}</div>`;
}).join('') || '<div style="padding:30px;text-align:center;color:#888">Nada por aqui ainda.</div>'}</div></div>`;
}
if (s === 'newpost') {
return `<div class="mxp-ig"><div class="mxp-igtop"><span class="bk" data-a="go" data-s="insta" style="font-size:24px;cursor:pointer">‹</span><b style="flex:1;font-size:16px">Nova publicação</b></div>${gmBar(v)}<div class="mxp-form">${igSel ? `<img src="${igSel}" style="width:100%;border-radius:10px">` : `<button class="mxp-btn g" data-a="igimg">📷 Escolher foto</button>`}${igSel ? '<button class="mxp-btn g" data-a="igimg">Trocar foto</button>' : ''}<textarea data-k="igtx" rows="3" placeholder="Escreva uma legenda (ou só texto)…">${esc(pDraft.igtx || '')}</textarea><button class="mxp-btn" data-a="post" style="background:#3897f0">Compartilhar</button></div></div>`;
}
if (s === 'contacts') {
const list = v.gm ? Object.values(v.ids).filter(x => x.npc) : v.contacts.map(id => v.ids[id]).filter(Boolean);
return `<div class="mxp-ap" style="background:#000"><div class="mxp-top" style="background:#000"><span class="bk" data-a="go" data-s="home">‹</span><b>Contatos</b>${v.gm ? '' : '<span data-a="go" data-s="addc" style="font-size:24px;cursor:pointer;color:#0a84ff">＋</span>'}</div>${v.gm ? '' : `<div class="mxp-card" style="background:#1c1c1e">${avHTML(v, v.me.id)}<div><b>${esc(v.me.name)}</b><div style="color:#8e8e93;font-size:13px">Meu número: <b style="color:#fff">${esc(v.me.num)}</b></div></div></div>`}<div class="mxp-list">${list.sort((a, b) => nameOf(v, a.id).localeCompare(nameOf(v, b.id))).map(x => `<div class="mxp-it" data-a="dm" data-id="${x.id}">${avHTML(v, x.id, 's')}<div class="tx"><b>${esc(nameOf(v, x.id))}</b><small>${esc(x.num)}</small></div>${!v.gm && x.id !== 'ordem' ? `<span data-a="delc" data-id="${x.id}" style="opacity:.4;cursor:pointer">✕</span>` : ''}</div>`).join('')}</div></div>`;
}
if (s === 'addc') {
return `<div class="mxp-ap" style="background:#000"><div class="mxp-top" style="background:#000"><span class="bk" data-a="go" data-s="contacts">‹</span><b>Novo contato</b></div><div class="mxp-form"><input data-k="cn" placeholder="Nome" value="${esc(pDraft.cn || '')}" maxlength="30"><input data-k="cnum" placeholder="Número (ex.: (88) 99123-4567)" value="${esc(pDraft.cnum || '')}" inputmode="tel" maxlength="20"><button class="mxp-btn" style="background:#0a84ff" data-a="addc">Salvar</button><div style="font-size:12px;color:#8e8e93">Para falar com outro agente, peça o número dele (aparece em Contatos).</div></div></div>`;
}
if (s === 'set') {
const idd = v.gm ? (gmAs ? v.ids[gmAs] : null) : v.me;
return `<div class="mxp-ap" style="background:#000"><div class="mxp-top" style="background:#000"><span class="bk" data-a="go" data-s="home">‹</span><b>Ajustes</b></div>${gmBar(v)}<div class="mxp-list">${idd ? `<div class="mxp-card" style="background:#1c1c1e;align-items:center">${avHTML(v, idd.id)}<button class="mxp-btn g" data-a="av">Trocar foto</button><div class="mxp-form" style="padding:0;width:100%"><input data-k="pn" placeholder="Nome" value="${esc(pDraft.pn != null ? pDraft.pn : idd.name)}" maxlength="30"><input data-k="pb" placeholder="Recado / bio" value="${esc(pDraft.pb != null ? pDraft.pb : idd.bio || '')}" maxlength="160"><button class="mxp-btn" data-a="prof">Salvar perfil</button></div><div style="font-size:12px;color:#8e8e93">${esc(idd.num)}</div></div>` : '<div class="mxp-card">Escolha um NPC lá em cima para editar o perfil dele.</div>'}${v.gm ? '' : `<div style="padding:8px 14px;font-size:12px;color:#8e8e93">PAPEL DE PAREDE</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 14px 14px">${WALLS.map((w, i) => `<div data-a="wall" data-i="${i}" style="aspect-ratio:9/16;border-radius:10px;background:${w};cursor:pointer;${(v.wall || 0) === i ? 'box-shadow:0 0 0 3px #0a84ff' : ''}"></div>`).join('')}</div>`}</div></div>`;
}
if (s === 'ctrl') {
const ph = v.phones || [];
const npcs = Object.values(v.ids).filter(x => x.npc);
return `<div class="mxp-ap" style="background:#0b0b0d"><div class="mxp-top" style="background:#150a0c"><span class="bk" data-a="go" data-s="home">‹</span><b>Controle do Mestre</b></div><div class="mxp-list"><div style="padding:10px 14px 0;font-size:12px;color:#8e8e93">CELULARES DOS AGENTES</div>${ph.map(p => { const x = v.ids[p.id] || {}; return `<div class="mxp-card"><div class="r">${avHTML(v, p.id, 's')}<div style="flex:1"><b>${esc(x.name || p.key)}</b><div style="font-size:11.5px;color:#8e8e93">${esc(x.num || '')} · ${p.online ? '🟢 online' : '⚪ offline'}</div></div><button class="mxp-btn g" style="padding:6px 10px;font-size:12px" data-a="spy" data-k="${esc(p.key)}">👁 Ver</button></div><div class="r"><span style="flex:1">📶 Sinal</span><div class="mxp-sw ${p.sig ? 'on' : ''}" data-a="sig" data-k="${esc(p.key)}" data-on="${p.sig ? 0 : 1}"></div></div><div class="r"><span style="flex:1">📱 Está com o celular</span><div class="mxp-sw ${p.has ? 'on' : ''}" data-a="take" data-k="${esc(p.key)}" data-on="${p.has ? 1 : 0}"></div></div><div class="r"><select class="mx-in" style="padding:6px;font-size:12px" data-a="give" data-k="${esc(p.key)}"><option value="">＋ dar contato a ${esc(x.name || p.key)}…</option>${Object.values(v.ids).filter(y => y.id !== p.id && !p.contacts.includes(y.id)).map(y => `<option value="${y.id}">${esc(y.name)}</option>`).join('')}</select></div></div>`; }).join('') || '<div class="mxp-card">Nenhum agente abriu o celular ainda. O celular de cada um aparece aqui quando ele entra na sala.</div>'}<div style="padding:10px 14px 0;font-size:12px;color:#8e8e93">NPCs (você fala por eles)</div><div class="mxp-card"><div class="mxp-form" style="padding:0"><input data-k="nn" placeholder="Nome do NPC" maxlength="30" value="${esc(pDraft.nn || '')}"><input data-k="nnum" placeholder="Número (vazio = gerar)" maxlength="20" value="${esc(pDraft.nnum || '')}"><input data-k="nbio" placeholder="Recado (opcional)" maxlength="160" value="${esc(pDraft.nbio || '')}"><button class="mxp-btn" data-a="mknpc">Criar NPC</button></div></div>${npcs.map(x => `<div class="mxp-it" style="cursor:default">${avHTML(v, x.id, 's')}<div class="tx"><b>${esc(x.name)}</b><small>${esc(x.num)}${x.by ? ' · adicionado por ' + esc(x.by) : ''}</small></div><span data-a="asnpc" data-id="${x.id}" style="cursor:pointer;font-size:12px;color:#00a884">falar como</span>${x.id !== 'ordem' ? `<span data-a="delnpc" data-id="${x.id}" style="cursor:pointer;opacity:.5;margin-left:8px">🗑</span>` : ''}</div>`).join('')}</div></div>`;
}
scr = 'home'; return screenHTML(v);
}
async function onPClick(e) {
const b = e.target.closest('[data-a]'); if (!b || !pEl.contains(b)) return;
if (e.type === 'change' && !['SELECT', 'INPUT'].includes(b.tagName)) return;
if (e.type === 'click' && b.tagName === 'SELECT') return;
const a = b.dataset.a, v = view();
if (a === 'close') return closePhone();
if (a === 'home') { scr = 'home'; return renderPhone(); }
if (a === 'spyoff') { spyKey = ''; scr = 'ctrl'; return renderPhone(); }
if (!v) return;
switch (a) {
case 'go': scr = b.dataset.s; if (scr === 'grp') newGrp = null; if (scr.startsWith('chat:')) markRead(scr.slice(5)); return renderPhone();
case 'as': gmAs = b.value; return renderPhone();
case 'asnpc': gmAs = b.dataset.id; scr = 'zap'; return renderPhone();
case 'dm': {
const id = b.dataset.id, me = meIdOf(v);
if (!me) return toast('Escolha como quem você vai falar (lá em cima).');
const c = (v.chats || []).find(c => !c.grp && c.mem.length === 2 && c.mem.includes(me) && c.mem.includes(id));
if (c) { scr = 'chat:' + c.id; markRead(c.id); return renderPhone(); }
pendingDM = id; pSend({op: 'send', to: id, tx: '', img: ''}); scr = 'dm:' + id; return renderPhone();
}
case 'send': {
const cid = b.dataset.id, k = 'm:' + cid, tx = (pDraft[k] || '').trim(); if (!tx) return;
pSend({op: 'send', cid, tx}); pDraft[k] = ''; const ta = pEl.querySelector(`[data-k="${k}"]`); if (ta) ta.value = ''; return;
}
case 'img': { const cid = scr.split(':')[1]; const img = await pickImage(); if (img) pSend({op: 'send', cid, tx: '', img}); return; }
case 'gmem': { const id = b.dataset.id; newGrp = newGrp || {mem: []}; if (b.checked) newGrp.mem.push(id); else newGrp.mem = newGrp.mem.filter(x => x !== id); return; }
case 'mkgrp': { if (!newGrp || !newGrp.mem.length) return toast('Escolha quem vai no grupo.'); if (v.gm && !gmAs && newGrp.mem.length < 2) return toast('Escolha pelo menos 2.'); pSend({op: 'grp', name: (pDraft.gname || 'Grupo').trim(), mem: newGrp.mem}); pDraft.gname = ''; newGrp = null; scr = 'zap'; return renderPhone(); }
case 'addc': { const nm = (pDraft.cn || '').trim(), num = (pDraft.cnum || '').trim(); if (!num) return toast('Digite o número.'); pSend({op: 'addc', name: nm, num}); pDraft.cn = pDraft.cnum = ''; scr = 'contacts'; return renderPhone(); }
case 'delc': e.stopPropagation(); if (await confirmBox('Apagar esse contato?')) pSend({op: 'delc', id: b.dataset.id}); return;
case 'like': case 'like2': { if (!meIdOf(v)) return; const p = (v.posts || []).find(x => x.id === b.dataset.id); if (a === 'like2' && p && p.likes.includes(meIdOf(v))) return; return pSend({op: 'like', id: b.dataset.id}); }
case 'com': { const k = 'c:' + b.dataset.id, tx = (pDraft[k] || '').trim(); if (!tx) return; pSend({op: 'com', id: b.dataset.id, tx}); pDraft[k] = ''; return; }
case 'delpost': if (await confirmBox('Apagar essa publicação?')) pSend({op: 'delpost', id: b.dataset.id}); return;
case 'igimg': igSel = await pickImage() || igSel; return renderPhone();
case 'post': { const tx = (pDraft.igtx || '').trim(); if (!igSel && !tx) return toast('Escolha uma foto ou escreva algo.'); pSend({op: 'post', tx, img: igSel || ''}); igSel = null; pDraft.igtx = ''; scr = 'insta'; return renderPhone(); }
case 'av': { const img = await pickImage(); if (img) pSend({op: 'prof', id: gmAs, av: img}); return; }
case 'prof': pSend({op: 'prof', id: gmAs, name: pDraft.pn, bio: pDraft.pb}); pDraft.pn = pDraft.pb = undefined; toast('Perfil salvo.'); return;
case 'wall': pSend({op: 'prof', wall: +b.dataset.i}); return;
case 'delchat': if (await confirmBox('Apagar essa conversa para todos?')) { send({k: 'p', op: 'clearchat', cid: b.dataset.id}); scr = 'zap'; } return;
case 'spy': spyKey = b.dataset.k; scr = 'home'; return renderPhone();
case 'sig': send({k: 'p', op: 'sig', key: b.dataset.k, on: b.dataset.on === '1'}); return;
case 'take': send({k: 'p', op: 'take', key: b.dataset.k, on: b.dataset.on === '1'}); return;
case 'give': if (b.value) send({k: 'p', op: 'give', key: b.dataset.k, id: b.value}); return;
case 'mknpc': { const nm = (pDraft.nn || '').trim(); if (!nm) return toast('Nome do NPC?'); send({k: 'p', op: 'mknpc', name: nm, num: (pDraft.nnum || '').trim(), bio: pDraft.nbio || ''}); pDraft.nn = pDraft.nnum = pDraft.nbio = ''; return; }
case 'delnpc': if (await confirmBox('Apagar esse NPC de todos os celulares?')) send({k: 'p', op: 'delnpc', id: b.dataset.id}); return;
}
}
let pendingDM = null, readT = {};
function markRead(cid) { if (spyKey) return; const now = Date.now(); if (readT[cid] && now - readT[cid] < 1500) return; readT[cid] = now; send({k: 'p', op: 'read', cid}); }
let lastRoster = '', helloAt = 0, lastConn = false;
function tick() {
const b = B(); if (!b) return;
if (isH()) {
hostInit();
const ros = rosterList().filter(p => p.id !== b.me().id).map(p => p.id + ':' + p.name + ':' + charName(p.id)).sort().join('|');
if (ros !== lastRoster) {
lastRoster = ros;
rosterList().forEach(p => { if (p.id !== b.me().id && p.role !== 'mestre') ensurePhone(kOf(p.name), p.id); });
Object.values(H.tables).forEach(t => t.seats.forEach(s => { if (s && !s.npc) s.name = dispName(s.key); }));
syncGames(); syncPhones();
}
if (!PV) { PV = phoneView(GM); GV = tablesView(GM); renderDockBadges(); }
} else {
const c = b.connected();
if (c && (!lastConn || Date.now() - helloAt > 60000 && !PV)) { helloAt = Date.now(); b.toHost({k: 'hello'}); }
if (!c && lastConn) { GV = {}; }
lastConn = c;
}
if (pOpen && scr === 'home') { const ck = pEl && pEl.querySelector('.mxp-clock'); if (ck) ck.textContent = hhmm(Date.now()); }
}
function boot() {
if (!window.MesaBridge) return setTimeout(boot, 300);
B().onHost = onHostMsg; B().onPlayer = onPlayerMsg;
ensureCSS();
setInterval(tick, 1500); tick();
renderDockBadges();
}
window.MesaX = {dockHTML, onDock, openGames, openPhone, _dbg: () => ({H, GV, PV}), _send: m => send(m)};
boot();
})();
