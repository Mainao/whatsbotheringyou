import AmbientStars from './AmbientStars';
import ShootingStar from './ShootingStar';
import styles from './UniverseCanvas.module.css';

export default function UniverseCanvas() {
    return (
        <div className={styles.universe}>
            {/* Radial vignette: lighter at centre, darker at edges */}
            <div className={styles.vignette} />
            <AmbientStars />
            <ShootingStar />
        </div>
    );
}
