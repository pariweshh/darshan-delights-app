import { useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"

import { landingScreenSlides } from "@/src/config/constants"
import Slide from "./slide"
import Slider from "./slider"

const LandingScreen = () => {
  const [index, setIndex] = useState(0)
  const prev = landingScreenSlides[index - 1]
  const next = landingScreenSlides[index + 1]

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slider
        key={index}
        index={index}
        setIndex={setIndex}
        prev={
          prev && (
            <Slide
              index={index}
              setIndex={setIndex}
              slide={prev}
              totalSlides={landingScreenSlides.length}
            />
          )
        }
        next={
          next && (
            <Slide
              index={index}
              setIndex={setIndex}
              slide={next}
              totalSlides={landingScreenSlides.length}
            />
          )
        }
      >
        <Slide
          slide={landingScreenSlides[index]}
          index={index}
          setIndex={setIndex}
          totalSlides={landingScreenSlides.length}
        />
      </Slider>
    </GestureHandlerRootView>
  )
}

export default LandingScreen
