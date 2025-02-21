import React from "react";

const Loader = () => {
    return (
      <div className="flex justify-center items-center w-full h-full py-8">
        <div className="animate-spin rounded-full border-t-4 border-white border-solid w-12 h-12"></div>
      </div>
    );
  };  
  
  export default Loader;