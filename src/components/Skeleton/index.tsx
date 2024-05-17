import cls from "classnames"
import React from "react"

type SkeletonProps = {
  classNames?: string
}
const Skeleton = ({ classNames = "" }: SkeletonProps) => {
  return (
    <div
      className={cls(
        classNames,
        "skeleton bg-preSelect dark:bg-preSelectDark mx-1 overflow-hidden relative after:block after:absolute after:left-[-150%] after:top-0 after:h-full after:w-[150%]"
      )}></div>
  )
}

export default Skeleton
