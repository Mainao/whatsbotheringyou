import AmbientStars from './AmbientStars';
import ExploreHint from './ExploreHint';
import ShootingStar from './ShootingStar';
import styles from './UniverseCanvas.module.css';
import UserStars from './UserStars';

export default function UniverseCanvas() {
    return (
        <div className={styles.universe}>
            {/* Radial vignette: lighter at centre, darker at edges */}
            <div className={styles.vignette} />
            {/* CSS starfield — 3 layers (1px/2px/3px), visible before JS, fades out when canvas is ready */}
            <div className={styles.cssStars}>
                <div className={styles.cssStarsS} />
                <div className={styles.cssStarsM} />
                <div className={styles.cssStarsL} />
            </div>
            <AmbientStars />
            <UserStars />
            <ShootingStar />
            <ExploreHint />
        </div>
    );
}
