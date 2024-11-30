import React from "react";
import './index.scss';

export const ResizeHandle = React.forwardRef((props, ref) => {
  return (
    <div
      className={`react-resizable-handle my-resize-handle`}
      ref={ref}
      {...props}
      >
        <div className="my-resize-handle-inner"></div>
    </div>
  )
})