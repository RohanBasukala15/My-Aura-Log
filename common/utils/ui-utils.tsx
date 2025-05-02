import { View } from "react-native";

type ViewMeasurement = {
  x: number;
  y: number;
  width: number;
  height: number;
};

async function measureInWindow(view: View): Promise<ViewMeasurement> {
  return new Promise((resolve) => {
    view.measureInWindow((x: number, y: number, width: number, height: number) =>
      resolve({
        x,
        y,
        width,
        height,
      })
    );
  });
}

export { measureInWindow };
