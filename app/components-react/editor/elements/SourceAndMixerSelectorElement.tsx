import React, { useState } from 'react';
import { Mixer } from './Mixer';
import { SourceSelectorElement } from './SourceSelector';
import { Menu } from 'antd';
import { $t } from 'services/i18n';

// // import useBaseElement from '../../../components-react/editor/elements/hooks';
// // import { SourceSelector } from 'components/shared/ReactComponentList';
// // import SourceSelectorElement from '../../../components-react/editor/elements/SourceSelector';
// // import { Menu } from 'antd';
// // import SourceSelectorElement from './SourceSelector';

// import { useState } from 'react';

// // import * as Elements from 'components/editor/elements';
// // import { ELayoutElement } from 'services/layout';
// // import TsxComponent from 'components/tsx-component';
// // import Mixer from 'components/editor/elements/Mixer';
// // import Scrollable from 'components-react/shared/Scrollable';

// // import { Component, Prop } from 'vue-property-decorator';
// // import MixerItem from 'components/MixerItem.vue';
// // import BaseElement from 'components/editor/elements/BaseElement';
// // function SourceAndMixerSelector() {

// //   return (
// //     <>
// //       <SourceSelector />
// //       <p>elomelo</p>
// //     </>
// //   );
// // }
// // @Component({
// //     components: { Mixer },
// //   })

export function SourceAndMixerSelectorElement() {
  // const containerRef = useRef<HTMLDivElement>(null);
  //   const { sourcesElement } = useBaseElement(
  //     <SourceSelectorElement />,
  //     { x: 200, y: 120 },
  //     containerRef.current,
  //   );
  // const { renderElement } = useBaseElement(
  //   <Mixer />,
  //   { x: 200, y: 120 },
  //   containerRef.current,
  // );
  const [activeTab, setActiveTab] = useState('video');
  //   const Element = Elements.Mixer.component('').
  return (
    <div
      // ref={containerRef}
      // data-name="SourceAndMixerSelector"
      // style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      style={{
        height: '100%',
        // border: '1px solid red',
        // backgroundColor: 'red'
      }}
    >
      <Menu
        onClick={e => setActiveTab(e.key)}
        selectedKeys={[activeTab]}
        mode="horizontal"
        style={{
          marginBottom: '16px',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Menu.Item key="video">{$t('Video')}</Menu.Item>
        <Menu.Item key="audio">{$t('Audio')}</Menu.Item>
      </Menu>
      {/* <SourceSelectorElement /> */}
      {activeTab == 'video' && <SourceSelectorElement />}
      {activeTab == 'audio' && <Mixer />}
    </div>
  );
}
