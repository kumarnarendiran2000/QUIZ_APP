// src/components/admin/scrollUtils.js

// Default scroll amount for different screen sizes
export const getScrollAmount = (isMobile) => isMobile ? 150 : 300;

// Scroll table functions with smooth behavior
export const scrollTableRight = (tableRef, scrollAmount) => {
  if (tableRef.current) {
    tableRef.current.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  }
};

export const scrollTableLeft = (tableRef, scrollAmount) => {
  if (tableRef.current) {
    tableRef.current.scrollBy({
      left: -scrollAmount,
      behavior: "smooth",
    });
  }
};

// Scroll page functions
export const scrollPageDown = (scrollAmount) => {
  window.scrollBy({
    top: scrollAmount,
    behavior: "smooth",
  });
};

export const scrollPageUp = (scrollAmount) => {
  window.scrollBy({
    top: -scrollAmount,
    behavior: "smooth",
  });
};

// Scroll to table function
export const scrollToTable = (tableRef) => {
  if (tableRef.current) {
    tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// Start continuous horizontal scrolling
export const startHorizontalScroll = (direction, tableRef, scrollAmount, setHorizontalScrollInterval, horizontalScrollInterval) => {
  // Clear any existing interval first
  clearInterval(horizontalScrollInterval);

  // Execute once immediately
  if (direction === "right") {
    scrollTableRight(tableRef, scrollAmount);
  } else {
    scrollTableLeft(tableRef, scrollAmount);
  }

  // Set up interval for continuous scrolling (every 250ms)
  const interval = setInterval(() => {
    if (direction === "right") {
      scrollTableRight(tableRef, scrollAmount);
    } else {
      scrollTableLeft(tableRef, scrollAmount);
    }
  }, 250);

  setHorizontalScrollInterval(interval);
};

// Start continuous vertical scrolling
export const startVerticalScroll = (direction, scrollAmount, setVerticalScrollInterval, verticalScrollInterval) => {
  // Clear any existing interval first
  clearInterval(verticalScrollInterval);

  // Execute once immediately
  if (direction === "down") {
    scrollPageDown(scrollAmount);
  } else {
    scrollPageUp(scrollAmount);
  }

  // Set up interval for continuous scrolling
  const interval = setInterval(() => {
    if (direction === "down") {
      scrollPageDown(scrollAmount);
    } else {
      scrollPageUp(scrollAmount);
    }
  }, 250);

  setVerticalScrollInterval(interval);
};

// Stop continuous scrolling
export const stopHorizontalScroll = (horizontalScrollInterval, setHorizontalScrollInterval) => {
  clearInterval(horizontalScrollInterval);
  setHorizontalScrollInterval(null);
};

export const stopVerticalScroll = (verticalScrollInterval, setVerticalScrollInterval) => {
  clearInterval(verticalScrollInterval);
  setVerticalScrollInterval(null);
};
