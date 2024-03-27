import React from "react"

import Skeleton from "~components/Skeleton"

function PreItem({ style }) {
  return (
    <div className="flex items-center h-16" style={style}>
      <Skeleton classNames="w-12 h-12 rounded-full ml-6" />
      <div className="h-3/4 flex flex-col justify-between">
        <Skeleton classNames="w-24 h-5 rounded-lg" />
        <Skeleton classNames="w-80 h-5 rounded-lg" />
      </div>
    </div>
  )
}

export default PreItem
