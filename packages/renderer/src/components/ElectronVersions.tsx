import {versions} from '#preload';

const ElectronVersion = () => {
  return (
    <table id="process-versions">
      <tbody>
        {Object.entries(versions).map(([lib, version]) => (
          <tr
            key={lib}
            aria-label="versions-row"
          >
            <td>{lib}</td>
            <td>v{version}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ElectronVersion;
