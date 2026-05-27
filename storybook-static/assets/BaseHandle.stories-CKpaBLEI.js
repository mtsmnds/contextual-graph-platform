import{n as e}from"./chunk-DnJy8xQt.js";import{t}from"./iframe-BDAfWOVq.js";import{a as n,c as r,i,n as a,o,t as s}from"./style-CXtbsotZ.js";function c({data:e}){return(0,u.jsxs)(`div`,{style:{padding:`20px 32px`,background:`var(--card)`,border:`1px solid var(--border)`,borderRadius:8,fontSize:13,color:`var(--foreground)`,position:`relative`},children:[(0,u.jsxs)(`span`,{children:[e.type===`source`?`Source`:e.type===`target`?`Target`:`Source & Target`,` handles`]}),d.map(({position:t,label:n,style:r})=>(0,u.jsx)(a,{type:e.type===`both`?`source`:e.type,position:t,id:n.toLowerCase(),style:r,title:n},n))]})}function l({nodes:e=p}){return(0,u.jsx)(`div`,{style:{width:400,height:300,border:`1px solid var(--border)`,borderRadius:8,overflow:`hidden`},children:(0,u.jsx)(i,{children:(0,u.jsx)(n,{nodeTypes:f,nodes:e,fitView:!0,panOnDrag:!1,zoomOnScroll:!1,zoomOnDoubleClick:!1,proOptions:{hideAttribution:!0}})})})}var u,d,f,p,m,h,g,_,v,y;e((()=>{o(),s(),u=t(),d=[{position:r.Top,label:`Top`,style:{top:-8}},{position:r.Right,label:`Right`,style:{right:-8}},{position:r.Bottom,label:`Bottom`,style:{bottom:-8}},{position:r.Left,label:`Left`,style:{left:-8}}],f={handleDemo:c},p=[{id:`1`,type:`handleDemo`,position:{x:50,y:50},data:{type:`both`}}],m={title:`Canvas/BaseHandle`,component:l,parameters:{layout:`centered`},tags:[`autodocs`,`ai-generated`]},h={},g={args:{nodes:[{id:`1`,type:`handleDemo`,position:{x:50,y:50},data:{type:`source`}}]}},_={args:{nodes:[{id:`1`,type:`handleDemo`,position:{x:50,y:50},data:{type:`target`}}]}},v={args:{nodes:[{id:`1`,type:`handleDemo`,position:{x:20,y:80},data:{type:`source`}},{id:`2`,type:`handleDemo`,position:{x:220,y:80},data:{type:`target`}}]}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    nodes: [{
      id: '1',
      type: 'handleDemo',
      position: {
        x: 50,
        y: 50
      },
      data: {
        type: 'source'
      }
    }]
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    nodes: [{
      id: '1',
      type: 'handleDemo',
      position: {
        x: 50,
        y: 50
      },
      data: {
        type: 'target'
      }
    }]
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    nodes: [{
      id: '1',
      type: 'handleDemo',
      position: {
        x: 20,
        y: 80
      },
      data: {
        type: 'source'
      }
    }, {
      id: '2',
      type: 'handleDemo',
      position: {
        x: 220,
        y: 80
      },
      data: {
        type: 'target'
      }
    }]
  }
}`,...v.parameters?.docs?.source}}},y=[`SourceAndTarget`,`SourceOnly`,`TargetOnly`,`ConnectedNodePair`]}))();export{v as ConnectedNodePair,h as SourceAndTarget,g as SourceOnly,_ as TargetOnly,y as __namedExportsOrder,m as default};