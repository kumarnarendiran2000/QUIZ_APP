// src/utils/deviceDetector.js

/**
 * Detects the user's device type based on screen size and user agent
 * @returns {string} "mobile", "tablet", or "desktop"
 */
export function detectDeviceType() {
  try {
    // Safeguard in case window or navigator isn't available
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return "desktop"; // Default fallback
    }

    const userAgent = navigator.userAgent || navigator.vendor || window.opera || "";
    
    // Check screen width first as a simple reliable indicator
    const width = window.innerWidth || window.screen.width || 0;
    
    // iPad Pro and other large tablets often have desktop user-agents but tablet screen sizes
    if (width >= 768 && width <= 1366) {
      // Check specifically for iPad
      if (/iPad/.test(userAgent) || 
          // iPadOS 13+ detection (uses desktop Safari UA but has touch events)
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        return "tablet";
      }
    }
    
    // Mobile detection
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent) 
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0,4))) {
      // Further check if tablet or mobile based on screen width
      if (width >= 768) {
        return "tablet";
      } else {
        return "mobile";
      }
    }
    
    // Check for tablet-specific patterns
    if (/tablet|ipad|playbook|silk|android(?!.*mobile)/i.test(userAgent.toLowerCase())) {
      return "tablet";
    }
    
    // If it has touch capabilities but not detected as mobile/tablet yet, it's likely a tablet
    if (window.navigator.maxTouchPoints > 1 && width >= 600) {
      return "tablet";
    }
    
    return "desktop";
  } catch (error) {
    console.error("Error detecting device type:", error);
    return "desktop"; // Safe fallback
  }
}

/**
 * Gets browser name and version
 * @returns {string} Browser name and version (e.g., "Chrome 115")
 */
export function getBrowserInfo() {
  // Default to Unknown
  let browserName = "Unknown";
  
  try {
    // Safeguard in case window or navigator isn't available
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return browserName;
    }
    
    const userAgent = navigator.userAgent || '';
    
    // Order matters! Chrome includes Safari in its UA string, Edge may include Chrome, etc.
    if (userAgent.indexOf("Firefox") > -1) {
      browserName = "Firefox";
    } else if (userAgent.indexOf("Edge") > -1 || userAgent.indexOf("Edg") > -1) {
      browserName = "Edge";
    } else if (userAgent.indexOf("OPR") > -1 || userAgent.indexOf("Opera") > -1) {
      browserName = "Opera";
    } else if (userAgent.indexOf("Chrome") > -1) {
      browserName = "Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
      browserName = "Safari";
    } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
      browserName = "Internet Explorer";
    }
    
    // Fallbacks for special cases
    if (browserName === "Unknown") {
      if ('chrome' in window) {
        browserName = "Chrome-based";
      } else if ('safari' in window) {
        browserName = "Safari-based";
      } else if ('InstallTrigger' in window) {
        browserName = "Firefox-based";
      }
    }
  } catch (error) {
    console.error("Error detecting browser info:", error);
  }
  
  return browserName; // Return just the browser name as requested
}

/**
 * Gets screen resolution
 * @returns {string} Screen resolution in format "widthxheight"
 */
export function getScreenResolution() {
  try {
    if (typeof window === 'undefined' || !window.screen) {
      return "Unknown";
    }
    return `${window.screen.width || 0}x${window.screen.height || 0}`;
  } catch (error) {
    console.error("Error getting screen resolution:", error);
    return "Unknown";
  }
}
