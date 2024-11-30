import { createElement } from 'react';
import { Typography } from '@douyinfe/semi-ui';
import { isEmpty } from '../../utils/lodash';

const Title = Typography.Title

export interface RichTypographyProps {
  subType: 'text' | 'title' | 'paragraph'; // 控件类型
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger', // 文案类型
  heading?: 1 | 2 | 3 | 4 | 5 | 6; // 标题级别
  size?: 'normal' | 'small'; // 文本大小
  strong?: boolean; // 是否加粗
  disabled?: boolean; // 是否禁用
  deleted?: boolean; // 是否有删除线
  ellipsis?: boolean; // 是否省略
  underline?: boolean; // 是否有下划线
  link?: boolean; // 是否是链接
  linkOptions?: { // 链接配置
    blank: boolean; // 是否在新标签页打开
    href: string; // 链接地址
  },
  content: string; // 文本内容
  style?: any; // 自定义样式
  line?: boolean; // 标题是否展示竖线
}

export const RichTypography = function ({
  subType,
  type,
  heading,
  size,
  strong,
  disabled,
  deleted,
  ellipsis,
  underline,
  link,
  linkOptions,
  content,
  style,
  line,
  __designMode
}: RichTypographyProps) {

  let linkProps: any = link;
  // 编辑态时不允许跳转
  if (link && !isEmpty(linkOptions) && __designMode !== 'design') {
    linkProps = {
      target: linkOptions.blank ? '_blank' : false,
      href: linkOptions.href || false,
    }
  }
  const props = {
    delete: deleted,
    disabled,
    ellipsis,
    underline,
    type,
    style,
    link: linkProps,
    children: content
  };

  if (subType === 'title') {
    Object.assign(props, { heading, line })
    return (
      <Title {...props} />
    )
  }

  const Component = subType === 'paragraph' ? Typography.Paragraph : Typography.Text;
  Object.assign(props, { strong, size });

  return (
    <Component {...props} />
  );

}
