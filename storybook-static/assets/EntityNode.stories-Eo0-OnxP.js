import{a as e,n as t}from"./chunk-DnJy8xQt.js";import{o as n,t as r}from"./iframe-BDAfWOVq.js";import{a as i,c as a,i as o,l as s,o as c,r as l,s as u,t as d}from"./style-CXtbsotZ.js";import{a as f,c as p,i as m,n as h,o as g,r as _,t as v}from"./useGraphStore-oB6bOVLe.js";function y({data:e}){let t=u(),[n,r]=(0,b.useState)(!!e.editTrigger),[i,o]=(0,b.useState)(e.content),c=(0,b.useRef)(null),d=(0,b.useRef)(!1),p=(0,b.useRef)(e.editTrigger??0),m=(0,b.useCallback)(()=>{r(!0),o(e.content)},[e.content]),v=(0,b.useCallback)(()=>{d.current||(d.current=!0,r(!1),h.getState().updateEntity(e.id,{content:i}))},[e.id,i]);(0,b.useEffect)(()=>{n||(d.current=!1)},[n]),(0,b.useEffect)(()=>{e.editTrigger&&e.editTrigger>p.current&&(p.current=e.editTrigger,m())},[e.editTrigger,m]);let y=(0,b.useCallback)(e=>{e.stopPropagation(),m()},[m]);(0,b.useEffect)(()=>{if(n&&c.current){c.current.focus();let e=i.length;c.current.setSelectionRange(e,e)}},[n,i.length]);let C=(0,b.useCallback)((t,n)=>{let r=h.getState();r.beginBatch(`Resize node`),r.updateEntity(e.id,{canvasData:{x:Math.ceil(n.x/S)*S,y:Math.ceil(n.y/S)*S,width:Math.ceil(n.width/S)*S,height:Math.ceil(n.height/S)*S}}),r.endBatch()},[e.id]),w=(0,b.useCallback)(e=>{e.key===`Escape`&&e.currentTarget.blur()},[]),T=(0,b.useCallback)(()=>{v()},[v]),E=(0,b.useCallback)(e=>{o(e.target.value)},[]);return(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)(l,{nodeId:t??void 0,variant:s.Line,position:a.Left,minWidth:64}),(0,x.jsx)(l,{nodeId:t??void 0,variant:s.Line,position:a.Right,minWidth:64,onResizeEnd:C}),(0,x.jsx)(l,{nodeId:t??void 0,variant:s.Line,position:a.Top,minHeight:32}),(0,x.jsx)(l,{nodeId:t??void 0,variant:s.Line,position:a.Bottom,minHeight:32,onResizeEnd:C}),(0,x.jsx)(f,{className:`entity-card w-full h-full overflow-hidden flex flex-col`,onDoubleClick:y,children:(0,x.jsxs)(g,{className:`entity-card-content flex-1 px-3`,children:[(0,x.jsx)(_,{type:`source`,position:a.Top,id:`top`}),(0,x.jsx)(_,{type:`source`,position:a.Right,id:`right`}),(0,x.jsx)(_,{type:`source`,position:a.Bottom,id:`bottom`}),(0,x.jsx)(_,{type:`source`,position:a.Left,id:`left`}),n?(0,x.jsx)(`textarea`,{ref:c,className:`nodrag nowheel nopan flex-1 resize-none border-none bg-transparent p-0 font-inherit text-sm focus:outline-none`,value:i,onChange:E,onKeyDown:w,onBlur:T,placeholder:`Type here...`,rows:1}):(0,x.jsx)(`p`,{className:`flex-1 overflow-hidden m-0 cursor-default text-sm text-foreground`,children:e.content||(0,x.jsx)(`span`,{className:`text-muted-foreground`,children:`Type here...`})})]})})]})}var b,x,S,C,w=t((()=>{b=e(n(),1),c(),p(),m(),v(),x=r(),S=16,C=(0,b.memo)(y),y.__docgenInfo={description:``,methods:[],displayName:`EntityNode`}}));function T({nodes:e=j}){return(0,E.jsx)(`div`,{style:{width:500,height:400,border:`1px solid var(--border)`,borderRadius:8,overflow:`hidden`},children:(0,E.jsx)(o,{children:(0,E.jsx)(i,{nodeTypes:A,nodes:e,fitView:!0,panOnDrag:!1,zoomOnScroll:!1,zoomOnDoubleClick:!1,proOptions:{hideAttribution:!0}})})})}var E,D,O,k,A,j,M,N,P,F,I,L;t((()=>{c(),d(),w(),E=r(),{expect:D,userEvent:O,within:k}=__STORYBOOK_MODULE_TEST__,A={entity:C},j=[{id:`entity-1`,type:`entity`,position:{x:0,y:0},data:{content:`Hello World`,type:`concept`,id:`entity-1`},style:{width:208}}],M={title:`Canvas/EntityNode`,component:T,parameters:{layout:`centered`},tags:[`autodocs`,`ai-generated`]},N={},P={args:{nodes:[{id:`entity-1`,type:`entity`,position:{x:0,y:0},data:{content:`A longer piece of text that wraps across multiple lines inside the entity node card`,type:`concept`,id:`entity-1`},style:{width:208}}]}},F={args:{nodes:[{id:`entity-1`,type:`entity`,position:{x:0,y:0},data:{content:``,type:`concept`,id:`entity-1`},style:{width:208}}]}},I={play:async({canvasElement:e})=>{let t=k(e).getByText(`Hello World`);await O.dblClick(t);let n=e.querySelector(`textarea`);await D(n).toBeVisible(),await O.clear(n),await O.type(n,`Edited via Storybook`),n.blur()}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    nodes: [{
      id: 'entity-1',
      type: 'entity',
      position: {
        x: 0,
        y: 0
      },
      data: {
        content: 'A longer piece of text that wraps across multiple lines inside the entity node card',
        type: 'concept',
        id: 'entity-1'
      },
      style: {
        width: 208
      }
    }]
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  args: {
    nodes: [{
      id: 'entity-1',
      type: 'entity',
      position: {
        x: 0,
        y: 0
      },
      data: {
        content: '',
        type: 'concept',
        id: 'entity-1'
      },
      style: {
        width: 208
      }
    }]
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const paragraph = canvas.getByText('Hello World');
    await userEvent.dblClick(paragraph);
    const textarea = canvasElement.querySelector('textarea')!;
    await expect(textarea).toBeVisible();
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Edited via Storybook');
    textarea.blur();
  }
}`,...I.parameters?.docs?.source}}},L=[`Concept`,`WithLongContent`,`Empty`,`DoubleClickEdit`]}))();export{N as Concept,I as DoubleClickEdit,F as Empty,P as WithLongContent,L as __namedExportsOrder,M as default};