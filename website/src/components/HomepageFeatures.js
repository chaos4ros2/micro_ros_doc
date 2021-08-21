import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Mission',
    Svg: require('../../static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Bridging the gap between resource-constrained microcontrollers and larger processors in robotic applications that are based on the Robot Operating Systems.
      </>
    ),
    video_link: "https://www.youtube.com/embed/slMhPRnBVwM",
  },
  {
    title: 'Getting Started',
    Svg: require('../../static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Our tutorials and demos give you a quick start with micro-ROS. The basic tutorials can even be completed without a microcontroller.
      </>
    ),
    video_link: "https://www.youtube.com/embed/wgIKGUGSX7Y",
  },
  {
    title: 'News',
    Svg: require('../../static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Read about the latest developments in our blog or attend the next ROS 2 Embedded Working Group Meeting, which take place online on a monthly basis. The meeting link can be found in the ROS 2 Events calendar.
      </>
    ),
    video_link: "https://www.youtube.com/embed/Vbab-YED2Us",
  },
];

function Feature({Svg, title, description, video_link}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        {/* <Svg className={styles.featureSvg} alt={title} /> */}
        <iframe width="356" height="200" src={video_link} frameborder="0" allowfullscreen></iframe>
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
