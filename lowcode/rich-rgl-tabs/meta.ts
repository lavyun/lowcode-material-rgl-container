import { ComponentMetadata, Snippet } from '@alilc/lowcode-types';
import { createRglConfig, createSettings } from '../utils/snippets';

const RichRglTabsMeta: ComponentMetadata = {
  componentName: "RichRglTabs",
  title: "选项卡",
  icon: 'https://img.alicdn.com/imgextra/i4/O1CN01mh9LPG268B90t8DaA_!!6000000007616-55-tps-56-56.svg',
  category: '容器类组件',
  devMode: "proCode",
  priority: 99,
  ...createRglConfig({
    w: 24,
    h: 50
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
        title: "标签栏样式",
        name: "type",
        setter: {
          componentName: "RadioGroupSetter",
          props: {
            options: [
              {
                label: "线条型",
                value: "line"
              },
              {
                label: "卡片型",
                value: "card"
              },
              {
                label: "按钮型",
                value: "button"
              }
            ]
          },
          initialValue: "line"
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
                value: "medium"
              },
              {
                label: "大",
                value: "large"
              }
            ]
          },
          initialValue: "small"
        }
      },
      {
        title: "标签栏排列方式",
        name: "tabPosition",
        setter: {
          componentName: "RadioGroupSetter",
          props: {
            options: [
              {
                label: "水平",
                value: "top"
              },
              {
                label: "竖直",
                value: "left"
              }
            ]
          },
          initialValue: "top"
        }
      },
      {
        title: "右侧扩展区域",
        name: "tabBarExtraContent",
        setter: {
          componentName: "SlotSetter",
          initialValue: {
            type: "JSSlot",
            value: []
          }
        }
      },
      {
        title: "标签项",
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
                      title: "标题",
                      name: "tab",
                      setter: {
                        componentName: "StringSetter",
                        isRequired: true,
                        initialValue: ""
                      }
                    },
                    {
                      title: "是否禁用",
                      name: "disabled",
                      setter: {
                        componentName: "BoolSetter",
                        initialValue: false
                      }
                    },
                    {
                      title: "icon",
                      name: "icon",
                      setter: {
                        componentName: "SlotSetter",
                        initialValue: {
                          type: "JSSlot",
                          value: [{
                            componentName: 'RichIcon',
                            props: {
                              icon: 'IconHelpCircle'
                            }
                          }]
                        }
                      },
                      extraProps: {
                        setValue(target, value) {
                          if (value === null) {
                            target.parent.setPropValue('icon', false)
                          }
                        }
                      }
                    },
                  ],
                }
              },
              initialValue: (t) => {
                const index = t.parent.parent.getPropValue('_index') || 3;
                t.parent.parent.setPropValue('_index', index + 1);
                return {
                  itemKey: `tab-item-${index}`,
                  tab: `标签项${index}`,
                };
              },
            }
          },
          isRequired: true,
          initialValue: []
        }
      },
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
    title: "选项卡",
    schema: {
      componentName: "RichRglTabs",
      props: {
        type: 'line',
        size: 'large',
        tabPosition: 'top',
        items: [
          {
            itemKey: 'tab-item-1',
            tab: '标签项1',
            icon: false,
          },
          {
            itemKey: 'tab-item-2',
            tab: '标签项2',
            icon: false,
          }
        ]
      }
    }
  }
];

export default {
  ...RichRglTabsMeta,
  snippets
};
