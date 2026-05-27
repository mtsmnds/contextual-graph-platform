import{a as e,n as t}from"./chunk-DnJy8xQt.js";import{o as n,t as r}from"./iframe-BDAfWOVq.js";function i({open:e,x:t,y:n,items:r,onClose:i}){let s=(0,a.useRef)(null);return(0,a.useEffect)(()=>{if(!e)return;let t=e=>{s.current&&!s.current.contains(e.target)&&i()},n=e=>{e.key===`Escape`&&i()};return setTimeout(()=>document.addEventListener(`click`,t),0),document.addEventListener(`keydown`,n),()=>{document.removeEventListener(`click`,t),document.removeEventListener(`keydown`,n)}},[e,i]),e?(0,o.jsx)(`div`,{ref:s,className:`fixed z-50 min-w-32 bg-popover text-popover-foreground border rounded-md shadow-xl py-1`,style:{left:t,top:n},children:r.map((e,t)=>(0,o.jsxs)(`div`,{children:[e.separator&&(0,o.jsx)(`div`,{className:`border-t my-1`}),(0,o.jsx)(`button`,{className:`w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground`,onClick:()=>{e.action(),i()},children:e.label})]},t))}):null}var a,o,s=t((()=>{a=e(n(),1),o=r(),i.__docgenInfo={description:``,methods:[],displayName:`GraphContextMenu`,props:{open:{required:!0,tsType:{name:`boolean`},description:``},x:{required:!0,tsType:{name:`number`},description:``},y:{required:!0,tsType:{name:`number`},description:``},items:{required:!0,tsType:{name:`Array`,elements:[{name:`MenuItem`}],raw:`MenuItem[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``}}}}));function c(){let[e,t]=(0,l.useState)(null),n=(0,l.useCallback)(e=>{e.preventDefault(),t({x:e.clientX,y:e.clientY})},[]),r=(0,l.useCallback)(()=>t(null),[]);return(0,u.jsxs)(`div`,{onContextMenu:n,style:{width:`100%`,height:300,display:`flex`,alignItems:`center`,justifyContent:`center`,background:`var(--muted)`,borderRadius:8,color:`var(--muted-foreground)`,fontSize:14,userSelect:`none`},children:[`Right-click anywhere`,(0,u.jsx)(i,{open:e!==null,x:e?.x??0,y:e?.y??0,items:[{label:`New Node`,action:()=>{}},{label:`New Group`,action:()=>{}},{label:`Paste`,action:()=>{}}],onClose:r})]})}var l,u,d,f,p,m,h,g,_,v,y;t((()=>{l=e(n(),1),s(),u=r(),{expect:d,userEvent:f,within:p}=__STORYBOOK_MODULE_TEST__,m={title:`Canvas/GraphContextMenu`,component:c,parameters:{layout:`fullscreen`},tags:[`autodocs`,`ai-generated`]},h={},g={render:()=>(0,u.jsx)(`div`,{style:{position:`relative`,width:`100%`,height:300},children:(0,u.jsx)(i,{open:!0,x:200,y:100,items:[{label:`Metadata: Hidden`,action:()=>{}},{label:`Add Child Node`,action:()=>{}},{label:`Add Child Container`,action:()=>{}},{label:`Detach from Group`,action:()=>{}},{label:`Edit`,action:()=>{}},{label:`Delete`,action:()=>{}}],onClose:()=>{}})})},_={render:()=>(0,u.jsx)(`div`,{style:{position:`relative`,width:`100%`,height:300},children:(0,u.jsx)(i,{open:!0,x:200,y:100,items:[{label:`Delete Edge`,action:()=>{}}],onClose:()=>{}})})},v={play:async({canvasElement:e})=>{let t=p(e),n=t.getByText(`Right-click anywhere`);await f.pointer({target:n,coords:{x:100,y:50},keys:`[MouseRight]`});let r=await t.findByText(`New Node`);await d(r).toBeVisible(),await f.click(r)}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    position: 'relative',
    width: '100%',
    height: 300
  }}>
      <GraphContextMenu open x={200} y={100} items={[{
      label: 'Metadata: Hidden',
      action: () => {}
    }, {
      label: 'Add Child Node',
      action: () => {}
    }, {
      label: 'Add Child Container',
      action: () => {}
    }, {
      label: 'Detach from Group',
      action: () => {}
    }, {
      label: 'Edit',
      action: () => {}
    }, {
      label: 'Delete',
      action: () => {}
    }]} onClose={() => {}} />
    </div>
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    position: 'relative',
    width: '100%',
    height: 300
  }}>
      <GraphContextMenu open x={200} y={100} items={[{
      label: 'Delete Edge',
      action: () => {}
    }]} onClose={() => {}} />
    </div>
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const target = canvas.getByText('Right-click anywhere');
    await userEvent.pointer({
      target,
      coords: {
        x: 100,
        y: 50
      },
      keys: '[MouseRight]'
    });
    const menuItem = await canvas.findByText('New Node');
    await expect(menuItem).toBeVisible();
    await userEvent.click(menuItem);
  }
}`,...v.parameters?.docs?.source}}},y=[`Default`,`NodeMenu`,`EdgeMenu`,`RightClickInteraction`]}))();export{h as Default,_ as EdgeMenu,g as NodeMenu,v as RightClickInteraction,y as __namedExportsOrder,m as default};