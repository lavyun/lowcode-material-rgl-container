
import { ComponentMetadata, Snippet} from '@alilc/lowcode-types';
import { createRglConfig } from '../utils/snippets';

const RichButtonMeta: ComponentMetadata = {
  componentName: "RichButton",
  title: "按钮",
  icon: 'https://alifd.oss-cn-hangzhou.aliyuncs.com/fusion-cool/icons/icon-light/ic_light_button.png',
  category: "基础组件",
  devMode: "proCode",
  ...createRglConfig({
    w: 2,
    h: 4,
    isHeightAuto: true,
    fullX: true
  }),
  configure: {
    props: [
      {
        title: "标题",
        name: "text",
        setter: {
          componentName: "StringSetter",
          isRequired: true,
          initialValue: "我是一个按钮"
        }
      },
      {
        title: "类型",
        name: "type",
        setter: {
          componentName: "SelectSetter",
          props: {
            options: [
              {
                label: "主要",
                value: "primary"
              },
              {
                label: "次要",
                value: "secondary"
              },
              {
                label: "第三",
                value: "tertiary"
              },
              {
                label: "警告",
                value: "warning"
              },
              {
                label: "危险",
                value: "danger"
              }
            ]
          },
          isRequired: true,
          initialValue: 'primary'
        }
      },
      {
        title: "尺寸",
        name: "size",
        setter: {
          componentName: "RadioGroupSetter",
          props: {
            options: [
              {
                label: "小",
                value: "small"
              },
              {
                label: "中",
                value: "default"
              },
              {
                label: "大",
                value: "large"
              }
            ]
          },
          isRequired: true,
          initialValue: "default"
        }
      },
      {
        title: "主题",
        name: "theme",
        setter: {
          componentName: "RadioGroupSetter",
          props: {
            options: [
              {
                label: "深色背景",
                value: "solid"
              },
              {
                label: "无背景",
                value: "borderless"
              },
              {
                label: "浅色背景",
                value: "light"
              }
            ]
          },
          isRequired: true,
          initialValue: 'light'
        }
      },
      {
        name: 'icon',
        title: { label: '图标', tip: 'icon | 设置按钮的图标组件' },
        setter: {
          componentName: 'SlotSetter',
          isRequired: true,
          initialValue: {
            type: 'JSSlot',

            value: [
              {
                componentName: 'RichIcon',
                props: {
                  size: 'default',
                  icon: 'IconHelpCircle'
                },
              },
            ],
          },
        },
      },
    ],
    supports: {
      style: true,
      loop: false,
      condition: false
    },
    component: {},
  },

};
const snippets: Snippet[] = [
  {
    title: "按钮",
    icon: 'https://alifd.oss-cn-hangzhou.aliyuncs.com/fusion-cool/icons/icon-light/ic_light_button.png',
    schema: {
      componentName: "RichButton",
      props: {
        text: '我是一个按钮',
        type: 'primary',
        theme: 'solid',
        icon: false
      }
    }
  }
];

export default {
  ...RichButtonMeta,
  snippets
};
