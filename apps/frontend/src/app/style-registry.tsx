"use client";

import { useState, type ReactNode } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";

interface InsertedStyle {
  name: string;
  isGlobal: boolean;
}

function createEmotionStyleRegistry() {
  const emotionCache = createCache({ key: "css" });
  emotionCache.compat = true;
  const insertIntoCache = emotionCache.insert;
  let stylesInsertedSinceLastFlush: InsertedStyle[] = [];

  emotionCache.insert = (...insertArguments) => {
    const [selector, serializedStyle] = insertArguments;
    if (emotionCache.inserted[serializedStyle.name] === undefined) {
      stylesInsertedSinceLastFlush.push({
        name: serializedStyle.name,
        isGlobal: !selector,
      });
    }
    return insertIntoCache(...insertArguments);
  };

  const flushInsertedStyles = () => {
    const insertedStyles = stylesInsertedSinceLastFlush;
    stylesInsertedSinceLastFlush = [];
    return insertedStyles;
  };

  return { emotionCache, flushInsertedStyles };
}

/**
 * Collects the Emotion styles generated while streaming the page and writes them
 * into the HTML head, so the server markup matches what the browser hydrates.
 */
export function StyleRegistry({ children }: { children: ReactNode }) {
  const [{ emotionCache, flushInsertedStyles }] = useState(createEmotionStyleRegistry);

  useServerInsertedHTML(() => {
    const insertedStyles = flushInsertedStyles();
    if (insertedStyles.length === 0) return null;

    const globalStyles: { name: string; css: string }[] = [];
    let scopedStylesCss = "";
    let scopedStylesDataAttribute = emotionCache.key;
    for (const { name, isGlobal } of insertedStyles) {
      const css = emotionCache.inserted[name];
      if (typeof css !== "string") continue;
      if (isGlobal) {
        globalStyles.push({ name, css });
      } else {
        scopedStylesCss += css;
        scopedStylesDataAttribute += ` ${name}`;
      }
    }

    return (
      <>
        {globalStyles.map(({ name, css }) => (
          <style
            key={name}
            data-emotion={`${emotionCache.key}-global ${name}`}
            dangerouslySetInnerHTML={{ __html: css }}
          />
        ))}
        {scopedStylesCss ? (
          <style
            data-emotion={scopedStylesDataAttribute}
            dangerouslySetInnerHTML={{ __html: scopedStylesCss }}
          />
        ) : null}
      </>
    );
  });

  return <CacheProvider value={emotionCache}>{children}</CacheProvider>;
}
