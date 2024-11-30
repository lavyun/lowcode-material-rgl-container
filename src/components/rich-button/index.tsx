import React, { createElement } from 'react';
import { Button } from '@douyinfe/semi-ui';

export const RichButton = function (props) {
  return (
    <Button {...props} >{props.text}</Button>
  );
}
