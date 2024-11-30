
import { ComponentMetadata, Snippet } from '@alilc/lowcode-types';

const RichRglContainerMeta: ComponentMetadata = {
  componentName: "RichRGLContainer",
  title: "磁贴布局",
  icon: 'https://alifd.oss-cn-hangzhou.aliyuncs.com/fusion-cool/icons/icon-light/ic_light_tag.png',
  category: '容器类组件',
  devMode: "proCode",
  hidden: true,
  configure: {
    props: [
      
    ],
    supports: {
      style: true,
      loop: false,
      condition: false
    },
    component: {
      isContainer: true,
      isMinimalRenderUnit: true,
      disableBehaviors: '*'
    },
    advanced: {

    },
  }
};

const snippets: Snippet[] = [
  {
    title: "磁贴布局",
    schema: {
      componentName: "RichRGLContainer"
    }
  }
];

export default {
  ...RichRglContainerMeta,
  snippets
};
