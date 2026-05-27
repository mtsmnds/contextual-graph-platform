import{n as e}from"./chunk-DnJy8xQt.js";import{t}from"./iframe-BDAfWOVq.js";import{n,t as r}from"./button-CdDQ9l06.js";import{n as i,t as a}from"./index.es-8O3IDhO5.js";var o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T;e((()=>{n(),a(),o=t(),{fn:s,expect:c,userEvent:l,within:u}=__STORYBOOK_MODULE_TEST__,d={title:`UI/Button`,component:r,parameters:{layout:`centered`},tags:[`autodocs`,`ai-generated`],argTypes:{variant:{control:`select`,options:[`default`,`outline`,`secondary`,`ghost`,`destructive`,`link`]},size:{control:`select`,options:[`default`,`xs`,`sm`,`lg`,`icon`,`icon-xs`,`icon-sm`,`icon-lg`]}},args:{onClick:s()}},f={args:{children:`Button`}},p={args:{variant:`outline`,children:`Outline`}},m={args:{variant:`secondary`,children:`Secondary`}},h={args:{variant:`ghost`,children:`Ghost`}},g={args:{variant:`destructive`,children:`Delete`}},_={args:{variant:`link`,children:`Link`}},v={args:{size:`sm`,children:`Small`}},y={args:{size:`xs`,children:`Tiny`}},b={args:{size:`lg`,children:`Large`}},x={args:{children:(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(i,{}),` Add`]})}},S={args:{size:`icon`,children:(0,o.jsx)(i,{}),"aria-label":`Add`}},C={args:{children:`Disabled`,disabled:!0}},w={args:{children:`Click me`,onClick:s()},play:async({args:e,canvasElement:t})=>{let n=u(t).getByRole(`button`);await l.click(n),await c(e.onClick).toHaveBeenCalledOnce()}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Button'
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'outline',
    children: 'Outline'
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Secondary'
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ghost'
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'destructive',
    children: 'Delete'
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'link',
    children: 'Link'
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'sm',
    children: 'Small'
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'xs',
    children: 'Tiny'
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'lg',
    children: 'Large'
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    children: <><Plus /> Add</>
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'icon',
    children: <Plus />,
    'aria-label': 'Add'
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Disabled',
    disabled: true
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Click me',
    onClick: fn()
  },
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  }
}`,...w.parameters?.docs?.source}}},T=[`Default`,`Outline`,`Secondary`,`Ghost`,`Destructive`,`Link`,`Small`,`ExtraSmall`,`Large`,`WithIcon`,`IconOnly`,`Disabled`,`ClickInteraction`]}))();export{w as ClickInteraction,f as Default,g as Destructive,C as Disabled,y as ExtraSmall,h as Ghost,S as IconOnly,b as Large,_ as Link,p as Outline,m as Secondary,v as Small,x as WithIcon,T as __namedExportsOrder,d as default};