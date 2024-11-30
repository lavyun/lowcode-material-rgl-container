
import { ComponentMetadata, Snippet } from '@alilc/lowcode-types';
import { createRglConfig, createSettings } from '../utils/snippets';

const RichRglSimpleStepsMeta: ComponentMetadata = {
  componentName: "RichRglSimpleSteps",
  title: "步骤条",
  icon: 'https://alifd.oss-cn-hangzhou.aliyuncs.com/fusion-cool/icons/icon-light/ic_light_step.png',
  category: '容器类组件',
  devMode: "proCode",
  priority: 98,
  ...createRglConfig({
    w: 24,
    h: 38
  }),
  ...createSettings({
    isContainer: true,
    unableClearSelectionWhenDrag: true,
    hiddenCallback: ({ isRglPage }) => {
      return isRglPage === false;
    }
  }),
  configure: {
    props: [
      {
        title: "步骤条类型",
        name: "type",
        setter: {
          componentName: "RadioGroupSetter",
          props: {
            options: [
              {
                label: "默认",
                value: "basic"
              },
              {
                label: "导航",
                value: "nav"
              }
            ]
          },
          initialValue: "basic"
        }
      },
      {
        title: '尺寸',
        name: "size",
        setter: {
          componentName: "RadioGroupSetter",
          props: {
            options: [
              {
                label: "默认",
                value: "default"
              },
              {
                label: "迷你",
                value: "small"
              }

            ]
          },
          initialValue: "default"
        }
      },
      {
        title: '步骤子项',
        name: "items",
        setter: {
          componentName: "ArraySetter",
          props: {
            itemSetter: {
              componentName: "ObjectSetter",
              props: {
                config: {
                  items: [
                    {
                      title: '标题',
                      name: "title",
                      setter: {
                        componentName: "StringSetter",
                        isRequired: true,
                        initialValue: "步骤子项"
                      }
                    },
                    {
                      title: '描述',
                      name: "description",
                      setter: {
                        componentName: "StringSetter",
                        isRequired: true,
                        initialValue: ""
                      }
                    }
                  ]
                }
              },
              initialValue (t) {
                const items = t.parent.parent.getPropValue('items');
                return {
                  title: `步骤${items.length + 1}`
                }
              }
            }
          }
        }
      }
    ],
    supports: {
      style: true,
      loop: false,
      condition: false
    },
    component: {
      isContainer: true,
      isMinimalRenderUnit: true
    },
    advanced: {}
  }
};
const snippets: Snippet[] = [
  {
    title: "步骤条",
    subTitle: '(便捷版)',
    schema: {
      componentName: "RichRglSimpleSteps",
      props: {
        items: [
          {
            title: '数据录入',
            description: '录入用户 UID 和金额'
          },
          {
            title: '信息确认'
          },
          {
            title: '审核'
          }
        ]
      }
    }
  }
];

export default {
  ...RichRglSimpleStepsMeta,
  snippets
};
