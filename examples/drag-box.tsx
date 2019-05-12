import * as React from "react";

const CIRCLE_SIZE = 85;

type State = {
  isDragging: boolean;
  hasCapture: boolean;
  circleLeft: number;
  circleTop: number;
};
class DragBox extends React.Component<{}, State> {
  state = {
    isDragging: false,
    hasCapture: false,
    circleLeft: 80,
    circleTop: 80
  };
  isDragging = false;
  previousLeft = 0;
  previousTop = 0;

  onDown = (event: any) => {
    // We store the initial coordinates to be able to calculate the changes
    // later on.
    this.extractPositionDelta(event);

    this.setState({ isDragging: true });
  };

  onMove = (event: any) => {
    if (!this.state.isDragging) {
      return;
    }
    const { left, top } = this.extractPositionDelta(event);

    this.setState(({ circleLeft, circleTop }) => ({
      circleLeft: circleLeft + left,
      circleTop: circleTop + top
    }));
  };

  onUp = (event: any) => {
    this.setState({ isDragging: false });
  };

  extractPositionDelta = (event: any) => {
    const left = event.pageX;
    const top = event.pageY;
    const delta = {
      left: left - this.previousLeft,
      top: top - this.previousTop
    };
    this.previousLeft = left;
    this.previousTop = top;
    return delta;
  };

  render() {
    const { hasCapture, circleLeft, circleTop } = this.state;

    const boxStyle = {
      border: "1px solid #d9d9d9",
      margin: "10px 0 20px",
      minHeight: 400,
      width: "100%",
      position: "relative"
    };

    const circleStyle = {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      position: "absolute",
      left: circleLeft,
      top: circleTop,
      backgroundColor: hasCapture ? "blue" : "green",
      touchAction: "none"
    };

    return (
      <div
        style={boxStyle as any}
        onPointerMove={this.state.isDragging ? this.onMove : undefined}
      >
        <div
          style={circleStyle as any}
          onPointerDown={this.onDown}
          onPointerUp={this.onUp}
          onPointerCancel={this.onUp}
        />
      </div>
    );
  }
}

export default DragBox;
