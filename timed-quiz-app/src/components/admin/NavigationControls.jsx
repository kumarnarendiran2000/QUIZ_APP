// src/components/admin/NavigationControls.jsx
import React from "react";
import useAdmin from "./hooks/useAdmin";
import * as scrollUtils from "./scrollUtils";

const NavigationControls = () => {
  const {
    showScrollButtons,
    setShowScrollButtons,
    tableRef,
    isMobile,
    horizontalScrollInterval,
    setHorizontalScrollInterval,
    verticalScrollInterval,
    setVerticalScrollInterval,
  } = useAdmin();

  const scrollAmount = scrollUtils.getScrollAmount(isMobile);

  const startHorizontalScroll = (direction) => {
    scrollUtils.startHorizontalScroll(
      direction,
      tableRef,
      scrollAmount,
      setHorizontalScrollInterval,
      horizontalScrollInterval
    );
  };

  const stopHorizontalScroll = () => {
    scrollUtils.stopHorizontalScroll(
      horizontalScrollInterval,
      setHorizontalScrollInterval
    );
  };

  const startVerticalScroll = (direction) => {
    scrollUtils.startVerticalScroll(
      direction,
      scrollAmount,
      setVerticalScrollInterval,
      verticalScrollInterval
    );
  };

  const stopVerticalScroll = () => {
    scrollUtils.stopVerticalScroll(
      verticalScrollInterval,
      setVerticalScrollInterval
    );
  };

  const scrollToTable = () => {
    scrollUtils.scrollToTable(tableRef);
  };

  return (
    <>
      {/* Sticky Navigation Controls Button */}
      <div className="fixed top-20 right-4 z-50">
        <button
          onClick={() => setShowScrollButtons((prev) => !prev)}
          className="bg-gray-800 hover:bg-gray-900 text-white text-xs md:text-sm px-3 py-2 rounded-full shadow-lg flex items-center opacity-50 hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
          title={`${
            showScrollButtons ? "Hide" : "Show"
          } Navigation Controls (Ctrl+N)`}
        >
          {showScrollButtons ? "Hide Controls" : "Show Controls"}
        </button>
      </div>

      {showScrollButtons && (
        <>
          {/* Horizontal Navigation */}
          <div className="fixed right-4 bottom-24 z-50 flex flex-col gap-2">
            <button
              onMouseDown={() => startHorizontalScroll("left")}
              onMouseUp={stopHorizontalScroll}
              onMouseLeave={stopHorizontalScroll}
              onTouchStart={() => startHorizontalScroll("left")}
              onTouchEnd={stopHorizontalScroll}
              className="bg-blue-700 hover:bg-blue-800 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
              title="Scroll Table Left (hold for continuous scroll)"
            >
              ←
            </button>
            <button
              onMouseDown={() => startHorizontalScroll("right")}
              onMouseUp={stopHorizontalScroll}
              onMouseLeave={stopHorizontalScroll}
              onTouchStart={() => startHorizontalScroll("right")}
              onTouchEnd={stopHorizontalScroll}
              className="bg-blue-700 hover:bg-blue-800 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
              title="Scroll Table Right (hold for continuous scroll)"
            >
              →
            </button>
          </div>

          {/* Vertical Navigation */}
          <div className="fixed right-4 bottom-4 z-50 flex gap-2">
            <button
              onMouseDown={() => startVerticalScroll("up")}
              onMouseUp={stopVerticalScroll}
              onMouseLeave={stopVerticalScroll}
              onTouchStart={() => startVerticalScroll("up")}
              onTouchEnd={stopVerticalScroll}
              className="bg-green-600 hover:bg-green-700 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
              title="Scroll Page Up (hold for continuous scroll)"
            >
              ↑
            </button>
            <button
              onMouseDown={() => startVerticalScroll("down")}
              onMouseUp={stopVerticalScroll}
              onMouseLeave={stopVerticalScroll}
              onTouchStart={() => startVerticalScroll("down")}
              onTouchEnd={stopVerticalScroll}
              className="bg-green-600 hover:bg-green-700 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
              title="Scroll Page Down (hold for continuous scroll)"
            >
              ↓
            </button>
          </div>

          {/* Quick access to table */}
          <div className="fixed left-4 bottom-4 z-50">
            <button
              onClick={scrollToTable}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-full shadow-lg flex items-center text-xs md:text-sm"
              title="Jump to Table"
            >
              <span className="mr-1 text-lg">📋</span> Go to Table
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default NavigationControls;
