from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import subprocess,json,re
ROOT=Path(__file__).resolve().parents[4]
class Doc(HTMLParser):
    def __init__(self,s):
        super().__init__(convert_charrefs=True);self.ids=[];self.links=[];self.body=[];self.depth=0;self.capture=0;self.head=[];self.inhead=False;self.feed(s)
    def handle_starttag(self,t,a):
        a=dict(a)
        if t=='head':self.inhead=True
        if self.inhead and t in ['meta','title','link','script'] and not(t=='link' and a.get('rel') in ['stylesheet','icon']) and not(t=='script' and a.get('src')):self.head.append((t,tuple(sorted(a.items()))))
        if a.get('id'):self.ids.append(a['id'])
        for k in ['href','src']:
            if a.get(k):self.links.append(a[k])
        if t not in ['img','meta','link','br','hr','input','source','wbr']:self.depth+=1
        if 'article-body' in a.get('class','').split():self.capture=self.depth
    def handle_endtag(self,t):
        if t=='head':self.inhead=False
        if self.capture==self.depth:self.capture=0
        if t not in ['img','meta','link','br','hr','input','source','wbr']:self.depth-=1
    def handle_data(self,s):
        if self.capture:self.body.append(s)
errors=[]
docs={p.name:Doc(p.read_text(encoding='utf-8')) for p in ROOT.glob('*.html')}
for name,d in docs.items():
    if len(d.ids)!=len(set(d.ids)):errors.append(name+':duplicate IDs')
    for raw in d.links:
        u=urlsplit(raw)
        if u.scheme or u.netloc:continue
        target=ROOT/unquote(u.path) if u.path else ROOT/name
        if not target.exists():errors.append(name+':missing '+raw)
        elif u.fragment and target.suffix=='.html' and target.name in docs and unquote(u.fragment) not in docs[target.name].ids:errors.append(name+':missing anchor '+raw)
article_count=0
for p in ROOT.glob('blog-*.html'):
    old=Doc(subprocess.check_output(['git','show','0387d76:'+p.name],cwd=ROOT).decode('utf-8'))
    new=docs[p.name];article_count+=1
    if re.sub(r'\s+',' ',''.join(old.body)).strip()!=re.sub(r'\s+',' ',''.join(new.body)).strip():errors.append(p.name+':article body changed')
    if old.head!=new.head:errors.append(p.name+':SEO head structure changed')
for lang in ['zh','en','ja']:
    d=json.loads((ROOT/f'assets/data/site.{lang}.json').read_text(encoding='utf-8'))
    if not any(e['date']=='2026/11/02' for e in d['notes']['entries']):errors.append(lang+':missing existing note')
    for name in docs:
        s=(ROOT/name).read_text(encoding='utf-8')
        for key in re.findall(r'data-(?:ui|aria|alt)="([^"]+)"',s):
            value=d['ui']
            try:
                for part in key.split('.'):value=value[part]
            except KeyError:errors.append(lang+':missing ui '+key)
print(json.dumps({'pages':len(docs),'articles_preserved':article_count,'errors':errors},ensure_ascii=False))
raise SystemExit(bool(errors))
