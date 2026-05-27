import{a as e,n as t}from"./chunk-DnJy8xQt.js";import{o as n,t as r}from"./iframe-BDAfWOVq.js";import{a as i,c as a,i as o,l as s,o as c,r as l,s as u,t as d}from"./style-CXtbsotZ.js";import{a as f,c as p,i as m,n as h,o as g,r as _,s as v,t as y}from"./useGraphStore-oB6bOVLe.js";function b({data:e}){let t=u(),[n,r]=(0,x.useState)(!1),[i,o]=(0,x.useState)(e.content),c=(0,x.useRef)(null),d=(0,x.useRef)(!1),p=(0,x.useRef)(e.editTrigger??0),m=(0,x.useCallback)(()=>{r(!0),o(e.content)},[e.content]),y=(0,x.useCallback)(()=>{d.current||(d.current=!0,r(!1),h.getState().updateEntity(e.id,{content:i}))},[e.id,i]);(0,x.useEffect)(()=>{n||(d.current=!1)},[n]),(0,x.useEffect)(()=>{e.editTrigger&&e.editTrigger>p.current&&(p.current=e.editTrigger,m())},[e.editTrigger,m]),(0,x.useEffect)(()=>{n&&c.current&&(c.current.focus(),c.current.select())},[n]);let b=(0,x.useCallback)(e=>{e.stopPropagation(),m()},[m]),C=(0,x.useCallback)(t=>{t.key===`Escape`&&(o(e.content),t.currentTarget.blur())},[e.content]),w=(0,x.useCallback)(()=>{y()},[y]),T=(0,x.useCallback)(e=>{o(e.target.value)},[]);return(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(l,{nodeId:t??void 0,variant:s.Line,position:a.Left,minWidth:272,minHeight:128}),(0,S.jsx)(l,{nodeId:t??void 0,variant:s.Line,position:a.Right,minWidth:272,minHeight:128}),(0,S.jsx)(l,{nodeId:t??void 0,variant:s.Line,position:a.Top,minWidth:272,minHeight:128}),(0,S.jsx)(l,{nodeId:t??void 0,variant:s.Line,position:a.Bottom,minWidth:272,minHeight:128}),(0,S.jsxs)(f,{className:`w-full overflow-hidden container-group-node`,children:[(0,S.jsx)(v,{onDoubleClick:b,children:n?(0,S.jsx)(`input`,{ref:c,className:`nodrag nopan flex-1 border-none bg-transparent p-0 font-semibold text-sm focus:outline-none`,value:i,onChange:T,onKeyDown:C,onBlur:w}):(0,S.jsx)(`span`,{className:`flex-1 font-semibold text-sm truncate`,children:e.content||(0,S.jsx)(`span`,{className:`text-muted-foreground`,children:`Untitled`})})}),(0,S.jsxs)(g,{className:`container-child-area min-h-[60px]`,children:[(0,S.jsx)(_,{type:`source`,position:a.Top,id:`top`}),(0,S.jsx)(_,{type:`source`,position:a.Right,id:`right`}),(0,S.jsx)(_,{type:`source`,position:a.Bottom,id:`bottom`}),(0,S.jsx)(_,{type:`source`,position:a.Left,id:`left`})]})]})]})}var x,S,C,w=t((()=>{x=e(n(),1),c(),p(),m(),y(),S=r(),C=(0,x.memo)(b),b.__docgenInfo={description:``,methods:[],displayName:`ContainerGroupNode`}}));function T({nodes:e=j}){return(0,E.jsx)(`div`,{style:{width:600,height:500,border:`1px solid var(--border)`,borderRadius:8,overflow:`hidden`},children:(0,E.jsx)(o,{children:(0,E.jsx)(i,{nodeTypes:A,nodes:e,fitView:!0,panOnDrag:!1,zoomOnScroll:!1,zoomOnDoubleClick:!1,proOptions:{hideAttribution:!0}})})})}var E,D,O,k,A,j,M,N,P,F,I;t((()=>{c(),d(),w(),E=r(),{expect:D,userEvent:O,within:k}=__STORYBOOK_MODULE_TEST__,A={containerGroup:C},j=[{id:`container-1`,type:`containerGroup`,position:{x:0,y:0},data:{content:`My Container`,id:`container-1`},style:{width:400}}],M={title:`Canvas/ContainerGroupNode`,component:T,parameters:{layout:`centered`},tags:[`autodocs`,`ai-generated`]},N={},P={args:{nodes:[{id:`container-1`,type:`containerGroup`,position:{x:0,y:0},data:{content:``,id:`container-1`},style:{width:400}}]}},F={play:async({canvasElement:e})=>{let t=k(e).getByText(`My Container`);await O.dblClick(t);let n=e.querySelector(`input`);await D(n).toBeVisible(),await O.clear(n),await O.type(n,`Renamed Container`),n.blur()}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    nodes: [{
      id: 'container-1',
      type: 'containerGroup',
      position: {
        x: 0,
        y: 0
      },
      data: {
        content: '',
        id: 'container-1'
      },
      style: {
        width: 400
      }
    }]
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByText('My Container');
    await userEvent.dblClick(title);
    const input = canvasElement.querySelector('input')!;
    await expect(input).toBeVisible();
    await userEvent.clear(input);
    await userEvent.type(input, 'Renamed Container');
    input.blur();
  }
}`,...F.parameters?.docs?.source}}},I=[`Default`,`EmptyTitle`,`DoubleClickEdit`]}))();export{N as Default,F as DoubleClickEdit,P as EmptyTitle,I as __namedExportsOrder,M as default};